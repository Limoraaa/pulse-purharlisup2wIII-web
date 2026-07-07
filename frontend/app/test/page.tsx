'use client';
import { useEffect, useState } from 'react';

export default function TestConnection() {
  const [result, setResult] = useState('Loading...');

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/ping`)
      .then(res => res.json())
      .then(data => {
        console.log('Response dari Laravel:', data);
        setResult(JSON.stringify(data));
      })
      .catch(err => {
        console.error('Error:', err);
        setResult('Gagal connect: ' + err.message);
      });
  }, []);

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>Test Koneksi ke Laravel</h1>
      <p>Hasil: {result}</p>
    </div>
  );
}