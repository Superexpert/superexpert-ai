'use client';
import { saveConsentAction } from '@/forms/form-actions';

export const TextMessageConsentContent = ({
    onSubmit,
}: {
    onSubmit: (result: string) => void;
}) => {
    const handleYes = async () => {
        await saveConsentAction('text-message-consent');
        onSubmit('Yes, the user has agreed to receive text messages.');
    };
    const handleNo = () => {
        onSubmit('No, the user has not agreed to receive text messages.');
    };

    return (
        <div>
            <h2>Text Message Consent</h2>
            <p className="mt-2 text-gray-700">
                Do you consent to receive text messages from us?
            </p>
            <div className="mt-4 flex justify-end gap-3">
                <button onClick={handleYes} className="modalButtonYes">
                    Yes
                </button>
                <button onClick={handleNo} className="modalButtonNo">
                    No
                </button>
            </div>
        </div>
    );
};
