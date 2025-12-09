import { useEffect, useMemo, useState } from 'react';

const DEFAULT_VOCAB = {
  staff: 'Staff',
  resource: 'Recurso agendable',
  customer: 'Cliente',
  reference: 'Referencia',
  reservation: 'Reserva',
  role: 'Cargo',
};

const getActiveTenantId = () =>
  localStorage.getItem('active_tenant_id') || null;

const getVocabStorageKey = (tenantId) =>
  tenantId ? `vocab-${tenantId}` : 'vocab-default';

const readStoredVocabulary = () => {
  const tenantId = getActiveTenantId();
  const keysToTry = tenantId
    ? [getVocabStorageKey(tenantId), 'vocab-default']
    : ['vocab-default'];

  for (const key of keysToTry) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        return { ...DEFAULT_VOCAB, ...JSON.parse(stored) };
      }
    } catch {
      // ignore parsing errors
    }
  }
  return { ...DEFAULT_VOCAB };
};

export const useVocabulary = () => {
  const [vocab, setVocab] = useState(() => readStoredVocabulary());

  useEffect(() => {
    const handleChange = (event) => {
      const next = event?.detail?.vocab || {};
      setVocab({ ...DEFAULT_VOCAB, ...next });
    };
    const handleStorage = (event) => {
      const tenantId = getActiveTenantId();
      const key = getVocabStorageKey(tenantId);
      if (event.key === key || event.key === 'vocab-default') {
        setVocab(readStoredVocabulary());
      }
    };

    window.addEventListener('vocabularyChanged', handleChange);
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('vocabularyChanged', handleChange);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  return useMemo(() => vocab, [vocab]);
};

export const formatPlural = (word = '') => {
  if (!word) return '';
  const trimmed = word.trim();
  if (/s$/i.test(trimmed)) return trimmed;
  return `${trimmed}s`;
};
