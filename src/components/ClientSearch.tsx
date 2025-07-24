import React, { useState, useEffect, useRef } from 'react';
import { Search, User, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';

interface Client {
  id: string;
  name: string;
}

interface Props {
  onSelect: (client: Client) => void;
  onNewClient?: () => void;
  selectedClientId?: string | null;
  className?: string;
}

export default function ClientSearch({ onSelect, onNewClient, selectedClientId, className = '' }: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchTerm.length >= 1) { // Réduit à 1 caractère pour commencer la recherche plus tôt
      searchClients();
    } else {
      setClients([]);
    }
  }, [searchTerm]);

  const searchClients = async () => {
    try {
      setLoading(true);
      const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
      
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .is('deleted_at', null)
        .order('name');

      if (error) throw error;

      // Amélioration du filtrage avec score de pertinence
      const scoredClients = (data || []).map(client => {
        const name = client.name.toLowerCase();
        let score = 0;

        // Calcul du score pour chaque terme
        terms.forEach(term => {
          // Score plus élevé pour les correspondances exactes
          if (name === term) score += 100;
          // Score élevé pour les correspondances au début
          else if (name.startsWith(term)) score += 75;
          // Score moyen pour les correspondances de mots
          else if (name.includes(` ${term}`)) score += 50;
          // Score plus faible pour les correspondances partielles
          else if (name.includes(term)) score += 25;
        });

        return { client, score };
      }).filter(({ score }) => score > 0); // Ne garde que les résultats pertinents

      // Tri par score et par nom
      const sortedClients = scoredClients
        .sort((a, b) => {
          if (b.score !== a.score) return b.score - a.score;
          return a.client.name.localeCompare(b.client.name);
        })
        .map(({ client }) => client);

      setClients(sortedClients);
      setHighlightedIndex(-1);
      setShowResults(true);
    } catch (err) {
      console.error('Error searching clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex(prev => 
          prev < clients.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex >= 0 && clients[highlightedIndex]) {
          handleSelect(clients[highlightedIndex]);
        } else if (clients.length === 0 && searchTerm.length >= 2 && onNewClient) {
          onNewClient();
          setShowResults(false);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowResults(false);
        break;
    }
  };

  const handleSelect = (client: Client) => {
    onSelect(client);
    setSearchTerm(client.name);
    setShowResults(false);
    inputRef.current?.blur();
  };

  const highlightSearchTerms = (text: string) => {
    if (!searchTerm) return text;

    const terms = searchTerm.toLowerCase().split(/\s+/).filter(Boolean);
    let result = text;
    const matches: { index: number; length: number }[] = [];

    terms.forEach(term => {
      const regex = new RegExp(term, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        matches.push({ index: match.index, length: match[0].length });
      }
    });

    // Trie les correspondances par position et évite les chevauchements
    matches.sort((a, b) => a.index - b.index);
    const validMatches = matches.reduce((acc, match) => {
      const lastMatch = acc[acc.length - 1];
      if (!lastMatch || match.index >= lastMatch.index + lastMatch.length) {
        acc.push(match);
      }
      return acc;
    }, [] as typeof matches);

    // Applique le surlignage en commençant par la fin pour ne pas perturber les indices
    return validMatches.reverse().reduce((text, { index, length }) => {
      return (
        text.slice(0, index) +
        `<mark class="bg-yellow-100 rounded-sm px-0.5">${text.slice(index, index + length)}</mark>` +
        text.slice(index + length)
      );
    }, text);
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className={`h-5 w-5 ${loading ? 'text-blue-500' : 'text-gray-400'}`} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => searchTerm.length >= 1 && setShowResults(true)}
          onKeyDown={handleKeyDown}
          className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition duration-150 ease-in-out sm:text-sm"
          placeholder="Rechercher un client..."
          autoComplete="off"
        />
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-500 border-t-transparent"></div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {showResults && (
          <>
            {clients.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.15 }}
                className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden"
              >
                <ul className="max-h-60 overflow-y-auto py-1">
                  {clients.map((client, index) => (
                    <motion.li
                      key={client.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.15, delay: index * 0.03 }}
                    >
                      <button
                        type="button"
                        onClick={() => handleSelect(client)}
                        onMouseEnter={() => setHighlightedIndex(index)}
                        className={`w-full px-4 py-2 text-left flex items-center space-x-3 transition-colors duration-150 ${
                          highlightedIndex === index || selectedClientId === client.id
                            ? 'bg-blue-50 text-blue-700'
                            : 'text-gray-900 hover:bg-gray-50'
                        }`}
                      >
                        <User className={`flex-shrink-0 h-5 w-5 ${
                          highlightedIndex === index || selectedClientId === client.id
                            ? 'text-blue-500'
                            : 'text-gray-400'
                        }`} />
                        <span 
                          className="flex-1 truncate"
                          dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerms(client.name)
                          }}
                        />
                      </button>
                    </motion.li>
                  ))}
                </ul>
              </motion.div>
            ) : (
              searchTerm.length >= 2 && onNewClient && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 mt-1 w-full bg-white rounded-lg shadow-lg border border-gray-200 p-4"
                >
                  <div className="text-center space-y-3">
                    <p className="text-gray-500">Aucun client trouvé</p>
                    <button
                      onClick={() => {
                        onNewClient();
                        setShowResults(false);
                      }}
                      className="inline-flex items-center px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Créer un nouveau client
                    </button>
                  </div>
                </motion.div>
              )
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
