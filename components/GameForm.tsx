
import React, { useState } from 'react';
import type { Game } from '../types';

interface GameFormProps {
  gameToEdit?: Game;
  onSave: (game: Omit<Game, 'id' | 'roles'> | Game) => void;
  onCancel: () => void;
}

const GameForm: React.FC<GameFormProps> = ({ gameToEdit, onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    team: gameToEdit?.team || '',
    opponent: gameToEdit?.opponent || '',
    date: gameToEdit?.date || '',
    time: gameToEdit?.time || '',
    location: gameToEdit?.location || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (gameToEdit) {
      onSave({ ...gameToEdit, ...formData });
    } else {
      onSave(formData);
    }
  };
  
  const formFields = [
      { name: 'team', label: 'Équipe', placeholder: 'Ex: U11 - Équipe 1'},
      { name: 'opponent', label: 'Adversaire', placeholder: 'Ex: Royat'},
      { name: 'date', label: 'Date', placeholder: 'Ex: Samedi 15 Novembre'},
      { name: 'time', label: 'Heure', placeholder: 'Ex: 11H00'},
      { name: 'location', label: 'Lieu', placeholder: 'Ex: Maison des Sports'},
  ]

  return (
    <div className="bg-white rounded-xl shadow-lg p-5 border-2 border-red-500">
      <form onSubmit={handleSubmit} className="space-y-4">
        <h3 className="text-xl font-bold text-slate-800">{gameToEdit ? 'Modifier le match' : 'Ajouter un nouveau match'}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {formFields.map(field => (
                 <div key={field.name}>
                    <label htmlFor={field.name} className="block text-sm font-medium text-slate-700 mb-1">{field.label}</label>
                    <input
                        type="text"
                        id={field.name}
                        name={field.name}
                        value={formData[field.name as keyof typeof formData]}
                        onChange={handleChange}
                        placeholder={field.placeholder}
                        required
                        className="w-full px-3 py-2 text-sm text-slate-700 bg-white border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                </div>
            ))}
        </div>
        <div className="flex justify-end gap-4 pt-4">
            <button 
                type="button" 
                onClick={onCancel} 
                className="px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-100 rounded-md hover:bg-slate-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-400 transition-colors"
            >
                Annuler
            </button>
            <button 
                type="submit" 
                className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors"
            >
                Enregistrer
            </button>
        </div>
      </form>
    </div>
  );
};

export default GameForm;
