import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Création du client Supabase
const supabaseClient = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Fonction pour archiver les anciennes transactions
async function archiveOldTransactions(monthsOld: number, userId?: string) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsOld);
  const cutoffDate = date.toISOString().split('T')[0];

  try {
    // Construire la requête de base
    let query = supabaseClient
      .from('transactions')
      .select('client_id, amount_sent, amount_paid, amount_to_pay')
      .lt('date', cutoffDate);

    // Si un userId est fourni, filtrer par les clients de cet utilisateur
    if (userId) {
      const { data: userClients } = await supabaseClient
        .from('clients')
        .select('id')
        .eq('created_by', userId);

      if (!userClients?.length) {
        return { success: true, message: 'Aucune transaction à archiver' };
      }

      const clientIds = userClients.map(client => client.id);
      query = query.in('client_id', clientIds);
    }

    // Exécuter la requête
    const { data: oldTransactions, error: selectError } = await query;

    if (selectError) throw selectError;
    if (!oldTransactions?.length) {
      return { success: true, message: 'Aucune transaction à archiver' };
    }

    // Créer un résumé par client
    const clientSummaries = oldTransactions.reduce((acc, transaction) => {
      const clientId = transaction.client_id;
      if (!acc[clientId]) {
        acc[clientId] = {
          total_sent: 0,
          total_paid: 0,
          total_to_pay: 0,
        };
      }
      acc[clientId].total_sent += transaction.amount_sent;
      acc[clientId].total_paid += transaction.amount_paid;
      acc[clientId].total_to_pay += transaction.amount_to_pay;
      return acc;
    }, {} as Record<string, { total_sent: number; total_paid: number; total_to_pay: number }>);

    // Créer une transaction de résumé pour chaque client
    for (const [clientId, summary] of Object.entries(clientSummaries)) {
      const { error: insertError } = await supabaseClient
        .from('transactions')
        .insert({
          client_id: clientId,
          amount_sent: summary.total_sent,
          amount_paid: summary.total_paid,
          amount_to_pay: summary.total_to_pay,
          date: cutoffDate,
          description: `Résumé automatique des transactions avant le ${cutoffDate}`
        });

      if (insertError) throw insertError;
    }

    // Supprimer les anciennes transactions
    let deleteQuery = supabaseClient
      .from('transactions')
      .delete()
      .lt('date', cutoffDate);

    if (userId) {
      const clientIds = Object.keys(clientSummaries);
      deleteQuery = deleteQuery.in('client_id', clientIds);
    }

    const { error: deleteError } = await deleteQuery;
    if (deleteError) throw deleteError;

    return { 
      success: true, 
      message: `Transactions avant ${cutoffDate}${userId ? ' pour l\'utilisateur sélectionné' : ''} archivées avec succès` 
    };
  } catch (error) {
    console.error('Erreur lors de l\'archivage:', error);
    throw error;
  }
}

Deno.serve(async (req) => {
  // Gérer les requêtes OPTIONS pour CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Vérifier si la requête est autorisée
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Non autorisé');
    }

    // Vérifier si l'utilisateur est admin
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Non autorisé');
    }

    const { data: adminCheck } = await supabaseClient
      .from('app_users')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!adminCheck?.is_admin) {
      throw new Error('Accès réservé aux administrateurs');
    }

    // Traiter la requête
    if (req.method === 'POST') {
      const { months, userId } = await req.json();
      const result = await archiveOldTransactions(months || 12, userId);

      return new Response(JSON.stringify(result), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      });
    }

    throw new Error('Méthode non supportée');
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
