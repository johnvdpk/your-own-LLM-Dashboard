'use client';

import { Suspense } from 'react';
import { ResetPasswordForm } from '@/components/Auth/ResetPasswordForm/ResetPasswordForm';
import styles from './page.module.css';

function ResetPasswordContent() {
  return (
    <div className={styles.container}>
      <ResetPasswordForm />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className={styles.container}>
        <div className={styles.loading}>Laden...</div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}

