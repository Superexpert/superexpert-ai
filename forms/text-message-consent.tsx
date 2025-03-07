"use client";

export const TextMessageConsentContent = ({
  onSubmit,
}: {
  onSubmit: (result: string) => void;
}) => {
  const handleYes = () => {
    onSubmit("Yes, the user has agreed to receive text messages.");
  };

  return (
    <div>
      <h2>Text Message Consent</h2>
      <p>Do you consent to receive text messages from us?</p>
      <div>
        <button onClick={handleYes}>Yes</button>
        <button>No</button>
      </div>
    </div>
  );
};