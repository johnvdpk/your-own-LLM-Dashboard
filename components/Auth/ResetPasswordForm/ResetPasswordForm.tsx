'use client';

// React/Next.js imports
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

// CSS modules
import styles from './ResetPasswordForm.module.css';

export function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const tokenParam = searchParams.get('token');
    if (!tokenParam) {
      setError('Geen reset token gevonden. Controleer je email link.');
    } else {
      setToken(tokenParam);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (password !== confirmPassword) {
      setError('Wachtwoorden komen niet overeen.');
      return;
    }

    if (password.length < 8) {
      setError('Wachtwoord moet minimaal 8 tekens lang zijn.');
      return;
    }

    if (!token) {
      setError('Geen reset token gevonden.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Er is iets misgegaan. Probeer het opnieuw.');
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      }
    } catch (err) {
      setError('Er is iets misgegaan. Probeer het opnieuw.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className={styles.form}>
        <div className={styles.success}>
          <h1 className={styles.title}>Wachtwoord gereset!</h1>
          <p>Je wachtwoord is succesvol gewijzigd.</p>
          <p>Je wordt doorgestuurd naar de login pagina...</p>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Nieuw wachtwoord instellen</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.field}>
        <label htmlFor="password">Nieuw wachtwoord</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading || !token}
          placeholder="Minimaal 8 tekens"
          minLength={8}
        />
      </div>
      
      <div className={styles.field}>
        <label htmlFor="confirmPassword">Bevestig wachtwoord</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          required
          disabled={loading || !token}
          placeholder="Herhaal je wachtwoord"
          minLength={8}
        />
      </div>
      
      <button 
        type="submit" 
        disabled={loading || !token} 
        className={styles.button}
      >
        {loading ? 'Wachtwoord resetten...' : 'Wachtwoord resetten'}
      </button>
      
      <div className={styles.back}>
        <button
          type="button"
          onClick={() => router.push('/login')}
          className={styles.linkButton}
          disabled={loading}
        >
          ← Terug naar login
        </button>
      </div>
    </form>
  );
}

