"use client";
import { saveConsentAction } from "@/forms/form-actions";

export const TextMessageConsentContent = ({
  onSubmit,
}: {
  onSubmit: (result: string) => void;
}) => {
  const handleYes = async () => {
    await saveConsentAction("text-message-consent");
    onSubmit("Yes, the user has agreed to receive text messages.");
  };
  const handleNo = () => {
    onSubmit("No, the user has not agreed to receive text messages.");
  };

  return (
    <div>
      <h2>Text Message Consent</h2>
      <p>Do you consent to receive text messages from us?</p>
      <div className="mt-4 flex gap-3">
        <button className="btn btnPrimary" onClick={handleYes}>Yes</button>
        <button className="btn btnCancel ml-3" onClick={handleNo}>No</button>
      </div>
    </div>
  );
};