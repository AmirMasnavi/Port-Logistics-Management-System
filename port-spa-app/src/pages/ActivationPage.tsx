import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { activateUserAccount } from '../services/apiService';

const ActivationPage: React.FC = () => {
    const [searchParams] = useSearchParams();
    const [message, setMessage] = useState('Activating your account...');
    const [isError, setIsError] = useState(false);

    const effectHasRun = useRef(false);
    
    useEffect(() => {

        if (effectHasRun.current) {
            return; // Don't run a second time
        }
        
        const token = searchParams.get('token');

        if (!token) {
            setMessage('No activation token found. Please check your link.');
            setIsError(true);
            return;
        }

        const activate = async () => {
            try {
                const result = await activateUserAccount(token);
                setMessage(result.message); // "Account activated successfully!..."
                setIsError(false);
            } catch (err: any) {
                setMessage(err.response?.data?.message || 'Failed to activate account.');
                setIsError(true);
            }
        };

        activate();
        effectHasRun.current = true;
    }, [searchParams]);

    return (
        <div className="panel max-w-lg mx-auto text-center">
            <h1 className={`text-2xl font-semibold ${isError ? 'text-red-600' : 'text-green-600'}`}>
                {isError ? 'Activation Failed' : 'Activation Complete'}
            </h1>
            <p className="mt-4 text-lg">{message}</p>
            {!isError && (
                <p className="mt-4">
                    {/* We can just use a normal 'a' tag to force a full page reload to the login modal */}
                    <a href="/" className="btn btn-primary">
                        Click here to Log In
                    </a>
                </p>
            )}
        </div>
    );
};

export default ActivationPage;