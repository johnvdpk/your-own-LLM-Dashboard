'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './ForgotPasswordForm.module.css';

interface ForgotPasswordFormProps {
  onBackToLogin?: () => void;
}

export function ForgotPasswordForm({ onBackToLogin }: ForgotPasswordFormProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Er is iets misgegaan. Probeer het opnieuw.');
      } else {
        setSuccess(true);
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Wachtwoord vergeten</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      
      {success ? (
        <div className={styles.success}>
          <p>Als dit emailadres bestaat, hebben we een wachtwoord reset link gestuurd.</p>
          <p>Controleer je inbox (en spam folder) en klik op de link om je wachtwoord te resetten.</p>
        </div>
      ) : (
        <>
          <p className={styles.description}>
            Vul je emailadres in en we sturen je een link om je wachtwoord te resetten.
          </p>
          
          <div className={styles.field}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              placeholder="jouw@email.nl"
            />
          </div>
          
          <button type="submit" disabled={loading} className={styles.button}>
            {loading ? 'Verzenden...' : 'Reset link versturen'}
          </button>
        </>
      )}
      
      {onBackToLogin && (
        <div className={styles.back}>
          <button
            type="button"
            onClick={onBackToLogin}
            className={styles.linkButton}
            disabled={loading}
          >
            ← Terug naar login
          </button>
        </div>
      )}
    </form>
  );
}

