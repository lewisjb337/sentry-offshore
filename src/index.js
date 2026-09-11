import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import App from './App';

import { AuthProvider } from './context/AuthContext';
import { OrganizationProvider } from './context/OrganizationContext';
import { AppDataProvider } from './context/AppDataContext';

import './styles/index.css';

const root =
    ReactDOM.createRoot(
        document.getElementById('root'),
    );

root.render(
    <React.StrictMode>
        <BrowserRouter>
            <AuthProvider>
                <OrganizationProvider>
                    <AppDataProvider>
                        <App />
                    </AppDataProvider>
                </OrganizationProvider>
            </AuthProvider>
        </BrowserRouter>
    </React.StrictMode>,
);