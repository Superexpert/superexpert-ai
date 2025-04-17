interface FormFieldProps {
    label: string;
    htmlFor: string;
    children: React.ReactNode;
    error?: string;
    instructions?: string;
    additionalInstructions?: string;
    type?: 'default' | 'checkbox';
    className?: string;
}

export function FormField({
    label,
    htmlFor,
    children,
    error,
    instructions,
    additionalInstructions,
    type = 'default',
    className = '',
}: FormFieldProps) {
    if (type === 'checkbox') {
        return (
            <div className={`formField ${className}`}>
                <label htmlFor={htmlFor} className="flex items-start gap-3">
                    <div className="pt-1">{children}</div>
                    <div>
                        <span className="text-base font-bold text-neutral-800">
                            {label}
                        </span>
                        {instructions && (
                            <div className="fieldInstructions mt-1">
                                {instructions}
                            </div>
                        )}
                    </div>
                </label>
                {error && <p className="error mt-2">{error}</p>}
            </div>
        );
    }

    // default (input/textarea/etc)
    return (
        <div className={`formField ${className}`}>
            <label htmlFor={htmlFor}>{label}</label>
            {additionalInstructions && (
                <div className="fieldAdditionalInstructions">{additionalInstructions}</div>
            )}
            {children}
            {error && <p className="error">{error}</p>}
            {instructions && (
                <div className="fieldInstructions">{instructions}</div>
            )}

        </div>
    );
}
