'use client';

// React/Next.js imports
import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';

// CSS modules
import styles from './LoginForm.module.css';

interface LoginFormProps {
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
}

export function LoginForm({ onSwitchToRegister, onSwitchToForgotPassword }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  /**
   * Handle form submission
   * @param e - Form event
   * @returns Promise that resolves when login is complete
   */
  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError('Invalid email or password');
      } else {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h1 className={styles.title}>Login</h1>
      
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.field}>
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <div className={styles.field}>
        <div className={styles.passwordHeader}>
          <label htmlFor="password">Wachtwoord</label>
          {onSwitchToForgotPassword && (
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className={styles.forgotLink}
              disabled={loading}
            >
              Vergeten?
            </button>
          )}
        </div>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          disabled={loading}
        />
      </div>
      
      <button type="submit" disabled={loading} className={styles.button}>
        {loading ? 'Inloggen...' : 'Login'}
      </button>
      
      {onSwitchToRegister && (
        <div className={styles.switch}>
          <p>Nog geen account?</p>
          <button
            type="button"
            onClick={onSwitchToRegister}
            className={styles.linkButton}
            disabled={loading}
          >
            Registreer hier
          </button>
        </div>
      )}
    </form>
  );
}