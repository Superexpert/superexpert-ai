'use client';
import { saveConsentAction } from '@/forms/form-actions';

export const PaymentConsentContent = ({
    onSubmit,
}: {
    onSubmit: (result: string) => void;
}) => {
    const handleYes = async () => {
        await saveConsentAction('text-message-consent');
        onSubmit('Yes, the user has agreed to pay.');
    };
    const handleNo = () => {
        onSubmit('No, the user has not agreed to pay.');
    };

    return (
        <div>
            <h2 className="text-xl font-semibold text-gray-900">Payment Consent</h2>
            <p className="mt-2 text-gray-700">
                Do you agree to pay 1 billion dollars for a home robot?
            </p>
            <div className="mt-4 flex justify-end gap-3">
                <button onClick={handleYes} className="bg-gray-900 text-white rounded-full px-6 py-3 text-base font-medium shadow-md hover:bg-emerald-950 transition-colors duration-200 ease-in-out">
                    Yes
                </button>
                <button onClick={handleNo} className="bg-gray-200 text-gray-700 rounded-full px-6 py-3 text-base font-medium shadow-md hover:bg-gray-300 transition-colors duration-200 ease-in-out">
                    No
                </button>
            </div>
        </div>
    );
};
