import React, { useRef } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';

interface LogoUploadProps {
  logo?: string;
  onLogoChange: (logo: string | undefined) => void;
}

export const LogoUpload: React.FC<LogoUploadProps> = ({ logo, onLogoChange }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        onLogoChange(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    onLogoChange(undefined);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClickUpload = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Firmenlogo
      </label>
      
      {logo ? (
        <div className="relative inline-block">
          <img
            src={logo}
            alt="Firmenlogo"
            className="w-24 h-24 object-contain border border-gray-300 rounded-lg bg-white"
          />
          <button
            onClick={handleRemoveLogo}
            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            title="Logo entfernen"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClickUpload}
          className="w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#9B1D20] hover:bg-gray-50 transition-colors"
        >
          <ImageIcon className="w-8 h-8 text-gray-400 mb-1" />
          <span className="text-xs text-gray-500 text-center">Logo hochladen</span>
        </div>
      )}
      
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
      
      <button
        type="button"
        onClick={handleClickUpload}
        className="flex items-center gap-2 px-3 py-2 text-sm text-[#9B1D20] border border-[#9B1D20] rounded-md hover:bg-[#9B1D20] hover:text-white transition-colors"
      >
        <Upload className="w-4 h-4" />
        {logo ? 'Logo ändern' : 'Logo auswählen'}
      </button>
      
      <p className="text-xs text-gray-500">
        Unterstützte Formate: JPG, PNG, GIF (max. 2MB)
      </p>
    </div>
  );
};
