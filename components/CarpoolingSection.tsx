import React, { useState, useCallback, memo } from 'react';
import type { CarpoolEntry } from '../types';
import { getStoredName, setStoredName } from '../utils/storage';
import PhoneDisplay from './PhoneDisplay';


import ConfirmModal from './ConfirmModal';

interface CarpoolingSectionProps {
    gameId: string;
    entries: CarpoolEntry[];
    isAdmin?: boolean;
    onAddEntry: (entry: Omit<CarpoolEntry, 'id'>) => void;
    onRemoveEntry: (entryId: string) => void;
}

const CarpoolingSection: React.FC<CarpoolingSectionProps> = memo(({
    entries,
    isAdmin = false,
    onAddEntry,
    onRemoveEntry
}) => {
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [formType, setFormType] = useState<'driver' | 'passenger'>('driver');
    const [name, setName] = useState(getStoredName());
    const [phone, setPhone] = useState('');
    const [seats, setSeats] = useState(3);
    const [departureLocation, setDepartureLocation] = useState('');

    const [confirmDelete, setConfirmDelete] = useState<{ id: string, name: string } | null>(null);

    const drivers = entries.filter(e => e.type === 'driver');
    const passengers = entries.filter(e => e.type === 'passenger');

    const storedName = getStoredName();

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        setStoredName(name);

        const entry: Omit<CarpoolEntry, 'id'> = {
            name: name.trim(),
            type: formType,
            ...(phone.trim() && { phone: phone.trim() }),
            ...({ seats }),
            ...(formType === 'driver' && departureLocation.trim() && { departureLocation: departureLocation.trim() })
        };

        onAddEntry(entry);
        setIsFormOpen(false);
        setPhone('');
        setDepartureLocation('');
    }, [name, phone, seats, departureLocation, formType, onAddEntry]);

    const handleRemove = useCallback((entryId: string, entryName: string) => {
        if (entryName.toLowerCase() === storedName.toLowerCase()) {
            onRemoveEntry(entryId);
        } else {
            setConfirmDelete({ id: entryId, name: entryName });
        }
    }, [storedName, onRemoveEntry]);

    const executeDelete = () => {
        if (confirmDelete) {
            onRemoveEntry(confirmDelete.id);
            setConfirmDelete(null);
        }
    };

    const openForm = (type: 'driver' | 'passenger') => {
        setFormType(type);
        setIsFormOpen(true);
    };

    return (
        <div>
            {/* Section Header */}
            <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">
                Covoiturage
            </h4>

            {/* Drivers Section */}
            {drivers.length > 0 && (
                <div className="mb-3">
                    <h5 className="text-[11px] font-medium text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                        <span>🚗</span> Conducteurs ({drivers.length})
                    </h5>
                    <div className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 border border-slate-100 dark:border-slate-700 rounded-xl overflow-hidden divide-y divide-slate-50 dark:divide-slate-700">
                        {drivers.map((driver) => (
                            <div
                                key={driver.id}
                                className={`px-3 py-2.5 ${driver.name.toLowerCase() === storedName.toLowerCase()
                                    ? 'bg-blue-50'
                                    : 'bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-medium text-slate-800 truncate">{driver.name}</span>
                                        <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-semibold rounded-md">
                                            {driver.seats || 1} pl.
                                        </span>
                                        {driver.name.toLowerCase() === storedName.toLowerCase() && (
                                            <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[10px] font-semibold rounded-full">
                                                Vous
                                            </span>
                                        )}
                                    </div>
                                    {(driver.name.toLowerCase() === storedName.toLowerCase() || isAdmin) && (
                                        <button
                                            onClick={() => handleRemove(driver.id, driver.name)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                            aria-label="Se désinscrire"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                {driver.departureLocation && (
                                    <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                                        📍 {driver.departureLocation}
                                    </p>
                                )}
                                {driver.phone && (
                                    <div className="mt-1">
                                        <PhoneDisplay phone={driver.phone} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Passengers Section */}
            {passengers.length > 0 && (
                <div className="mb-3">
                    <h5 className="text-[11px] font-medium text-slate-400 uppercase mb-2 flex items-center gap-1.5">
                        <span>🙋</span> Passagers ({passengers.length})
                    </h5>
                    <div className="bg-gradient-to-br from-slate-50 to-white border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-50">
                        {passengers.map((passenger) => (
                            <div
                                key={passenger.id}
                                className={`px-3 py-2.5 ${passenger.name.toLowerCase() === storedName.toLowerCase()
                                    ? 'bg-amber-50'
                                    : 'bg-white'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 min-w-0">
                                        <span className="text-sm font-medium text-slate-800 truncate">{passenger.name}</span>
                                        <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-md">
                                            {passenger.seats || 1} pl.
                                        </span>
                                        {passenger.name.toLowerCase() === storedName.toLowerCase() && (
                                            <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-semibold rounded-full">
                                                Vous
                                            </span>
                                        )}
                                    </div>
                                    {(passenger.name.toLowerCase() === storedName.toLowerCase() || isAdmin) && (
                                        <button
                                            onClick={() => handleRemove(passenger.id, passenger.name)}
                                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm"
                                            aria-label="Se désinscrire"
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                                {passenger.phone && (
                                    <div className="mt-1">
                                        <PhoneDisplay phone={passenger.phone} />
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Empty State */}
            {entries.length === 0 && !isFormOpen && (
                <p className="text-center text-slate-400 py-3 text-sm">
                    Aucun covoiturage proposé
                </p>
            )}

            {/* Compact Action Buttons */}
            {!isFormOpen && (
                <div className="flex gap-2 mt-3">
                    <button
                        onClick={() => openForm('driver')}
                        className="flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5
                            text-sm font-medium text-blue-600 bg-blue-50 rounded-xl
                            hover:bg-blue-100 transition-colors"
                    >
                        <span>🚗</span>
                        <span>Je propose</span>
                    </button>
                    <button
                        onClick={() => openForm('passenger')}
                        className="flex-1 py-2.5 px-3 flex items-center justify-center gap-1.5
                            text-sm font-medium text-amber-600 bg-amber-50 rounded-xl
                            hover:bg-amber-100 transition-colors"
                    >
                        <span>🙋</span>
                        <span>Je cherche</span>
                    </button>
                </div>
            )}

            {/* Compact Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="mt-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <h5 className="font-medium text-slate-800 mb-3 text-sm flex items-center gap-2">
                        {formType === 'driver' ? (
                            <>🚗 Je propose des places</>
                        ) : (
                            <>🙋 Je cherche une place</>
                        )}
                    </h5>

                    <div className="space-y-2.5">
                        {/* Name */}
                        <input
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Votre nom *"
                            required
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        {/* Phone */}
                        <input
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="Téléphone (optionnel)"
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-blue-400"
                        />

                        {/* Seats */}
                        <select
                            value={seats}
                            onChange={(e) => setSeats(Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                focus:outline-none focus:ring-2 focus:ring-blue-400"
                        >
                            {(formType === 'driver' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4]).map(n => (
                                <option key={n} value={n}>{n} place{n > 1 ? 's' : ''}</option>
                            ))}
                        </select>

                        {/* Driver-specific: Departure Location */}
                        {formType === 'driver' && (
                            <input
                                type="text"
                                value={departureLocation}
                                onChange={(e) => setDepartureLocation(e.target.value)}
                                placeholder="Lieu de départ (optionnel)"
                                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg
                                    focus:outline-none focus:ring-2 focus:ring-blue-400"
                            />
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-2 mt-3">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="flex-1 py-2 px-3 text-sm font-medium text-slate-600 bg-slate-200
                                rounded-lg hover:bg-slate-300 transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 py-2 px-3 text-sm font-semibold text-white rounded-lg
                                transition-colors ${formType === 'driver'
                                    ? 'bg-blue-500 hover:bg-blue-600'
                                    : 'bg-amber-500 hover:bg-amber-600'
                                }`}
                        >
                            Confirmer
                        </button>
                    </div>
                </form>
            )}

            <ConfirmModal
                isOpen={!!confirmDelete}
                title="Retirer du covoiturage"
                message={`Voulez-vous vraiment retirer ${confirmDelete?.name} ?`}
                confirmText="Retirer"
                confirmStyle="danger"
                onConfirm={executeDelete}
                onCancel={() => setConfirmDelete(null)}
            />
        </div>
    );
});

CarpoolingSection.displayName = 'CarpoolingSection';

export default CarpoolingSection;
