const EMAIL_KEY = 'fin_saved_email';
const PASS_KEY = 'fin_saved_password';
const REMEMBER_KEY = 'fin_remember_login';

export function loadSavedLogin() {
  const remember = localStorage.getItem(REMEMBER_KEY) !== '0';
  const email = localStorage.getItem(EMAIL_KEY)
    || localStorage.getItem('fin_user_email')
    || '';
  const password = remember ? (localStorage.getItem(PASS_KEY) || '') : '';
  return { email, password, remember };
}

export function saveSavedLogin(email, password, remember) {
  localStorage.setItem(EMAIL_KEY, email);
  localStorage.setItem(REMEMBER_KEY, remember ? '1' : '0');
  if (remember && password) {
    localStorage.setItem(PASS_KEY, password);
  } else {
    localStorage.removeItem(PASS_KEY);
  }
}
