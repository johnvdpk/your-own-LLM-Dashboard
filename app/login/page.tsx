'use client';

import { useState } from 'react';
import { LoginForm } from '@/components/Auth/LoginForm/LoginForm';
import { RegisterForm } from '@/components/Auth/RegisterForm/RegisterForm';
import { ForgotPasswordForm } from '@/components/Auth/ForgotPasswordForm/ForgotPasswordForm';
import styles from './page.module.css';

export default function LoginPage() {
  const [isRegistering, setIsRegistering] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  return (
    <div className={styles.container}>
      {isForgotPassword ? (
        <ForgotPasswordForm onBackToLogin={() => setIsForgotPassword(false)} />
      ) : isRegistering ? (
        <RegisterForm onSwitchToLogin={() => setIsRegistering(false)} />
      ) : (
        <LoginForm 
          onSwitchToRegister={() => setIsRegistering(true)}
          onSwitchToForgotPassword={() => setIsForgotPassword(true)}
        />
      )}
    </div>
  );
}