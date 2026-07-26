'use client';

import { useState, useEffect } from 'react';

const CUSTOMER_DATA_KEY = 'valle_real_customer_info';

export interface CustomerData {
  name: string;
  address: string;
  zone: 'low' | 'high';
}

export function useCustomerData(isOpen: boolean) {
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [zone, setZone] = useState<'low' | 'high'>('low');
  const [hasSavedData, setHasSavedData] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    // queueMicrotask difiere la ejecución un micro-tick, 
    // evitando el renderizado síncrono en cascada (y calmando al linter).
    queueMicrotask(() => {
      const savedData = localStorage.getItem(CUSTOMER_DATA_KEY);
      if (!savedData) return;

      try {
        const parsed = JSON.parse(savedData);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.address) setAddress(parsed.address);
        if (parsed.zone) setZone(parsed.zone);
        setHasSavedData(true);
      } catch (e) {
        console.error('Error al cargar datos guardados:', e);
      }
    });
  }, [isOpen]);

  const saveCustomerData = (data: CustomerData) => {
    localStorage.setItem(CUSTOMER_DATA_KEY, JSON.stringify(data));
  };

  return {
    customerName,
    setCustomerName,
    address,
    setAddress,
    zone,
    setZone,
    hasSavedData,
    saveCustomerData,
  };
}