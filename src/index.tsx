import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthWrapper } from './components/AuthWrapper';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthWrapper>
      {({ user, userProfile, projectId, db, onLogout, onBackToProjects, theme, setTheme, colorSystem, setColorSystem, language, setLanguage }) => (
        <App 
            user={user}
            userProfile={userProfile}
            projectId={projectId}
            db={db}
            onLogout={onLogout}
            onBackToProjects={onBackToProjects}
            theme={theme}
            setTheme={setTheme}
            colorSystem={colorSystem}
            setColorSystem={setColorSystem}
            language={language}
            setLanguage={setLanguage}
        />
      )}
    </AuthWrapper>
  </React.StrictMode>
);