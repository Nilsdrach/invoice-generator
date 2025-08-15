import React from 'react';
import { X, Crown, Download, Check } from 'lucide-react';

interface WatermarkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  onSinglePurchase: () => void;
  onContinue: () => void;
}

export const WatermarkModal: React.FC<WatermarkModalProps> = ({
  isOpen,
  onClose,
  onUpgrade,
  onSinglePurchase,
  onContinue
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            PDF erstellen
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Download className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-gray-600 mb-2">
              PDF erstellen
            </p>
            <p className="text-sm text-gray-500">
              Wählen Sie, ob Sie das PDF mit oder ohne Wasserzeichen erstellen möchten.
            </p>
          </div>

          {/* Options */}
          <div className="space-y-3">
            {/* Abo Option */}
            <button
              onClick={onUpgrade}
              className="w-full flex items-center justify-center gap-3 p-3 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors font-medium"
            >
              <Crown className="w-5 h-5" />
              Abo abschließen (ab 9,99€/Monat)
            </button>

            {/* Einzel-PDF Option */}
            <button
              onClick={onSinglePurchase}
              className="w-full flex items-center justify-center gap-3 p-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <Download className="w-5 h-5" />
              Wasserzeichen entfernen (1,99€)
            </button>

            {/* Weiter mit Wasserzeichen */}
            <button
              onClick={onContinue}
              className="w-full p-3 text-gray-500 hover:text-gray-700 transition-colors font-medium"
            >
              Mit Wasserzeichen fortfahren
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-center text-gray-500">
            Alle Preise inklusive MwSt. Sie können jederzeit kündigen.
          </p>
        </div>
      </div>
    </div>
  );
};
