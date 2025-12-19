import React, { useState, useCallback, memo } from 'react';
import type { CarpoolEntry } from '../types';
import { getStoredName, setStoredName } from '../utils/storage';

// --- Phone Masking Component for Privacy ---
const PhoneDisplay: React.FC<{ phone: string }> = memo(({ phone }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    const maskPhone = (phoneNumber: string): string => {
        // Keep first 2 and last 2 digits, mask the rest
        const digits = phoneNumber.replace(/\D/g, '');
        if (digits.length <= 4) return phoneNumber; // Too short to mask
        const first = digits.slice(0, 2);
        const last = digits.slice(-2);
        return `${first} •• •• •• ${last}`;
    };

    return (
        <button
            onClick={() => setIsRevealed(!isRevealed)}
            className="flex items-center gap-1 text-sm text-slate-500 hover:text-blue-600 transition-colors group"
            title={isRevealed ? "Cliquer pour masquer" : "Cliquer pour afficher le numéro"}
        >
            <span>📞</span>
            <span className={isRevealed ? '' : 'font-mono'}>
                {isRevealed ? phone : maskPhone(phone)}
            </span>
            <span className="text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                {isRevealed ? '🔒' : '👁️'}
            </span>
        </button>
    );
});
PhoneDisplay.displayName = 'PhoneDisplay';

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

    const drivers = entries.filter(e => e.type === 'driver');
    const passengers = entries.filter(e => e.type === 'passenger');

    const storedName = getStoredName();

    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) return;

        // Store name for future use
        setStoredName(name);

        const entry: Omit<CarpoolEntry, 'id'> = {
            name: name.trim(),
            type: formType,
            ...(phone.trim() && { phone: phone.trim() }),
            ...({ seats }),  // Both drivers and passengers can specify seats
            ...(formType === 'driver' && departureLocation.trim() && { departureLocation: departureLocation.trim() })
        };

        onAddEntry(entry);
        setIsFormOpen(false);
        setPhone('');
        setDepartureLocation('');
    }, [name, phone, seats, departureLocation, formType, onAddEntry]);

    const handleRemove = useCallback((entryId: string, entryName: string) => {
        if (entryName.toLowerCase() === storedName.toLowerCase() ||
            window.confirm(`Voulez-vous retirer ${entryName} du covoiturage ?`)) {
            onRemoveEntry(entryId);
        }
    }, [storedName, onRemoveEntry]);

    const openForm = (type: 'driver' | 'passenger') => {
        setFormType(type);
        setIsFormOpen(true);
    };

    return (
        <div className="mt-6 pt-6 border-t border-slate-200">
            {/* Section Header */}
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl">
                    <span className="text-xl">🚗</span>
                </div>
                <div>
                    <h4 className="font-bold text-slate-800 text-lg">Covoiturage</h4>
                    <p className="text-sm text-slate-500">Organisez vos trajets ensemble</p>
                </div>
            </div>

            {/* Drivers Section */}
            {drivers.length > 0 && (
                <div className="mb-4">
                    <h5 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <span>🚗</span> Conducteurs ({drivers.length})
                    </h5>
                    <div className="space-y-2">
                        {drivers.map((driver) => (
                            <div
                                key={driver.id}
                                className={`p-3 rounded-xl transition-all ${driver.name.toLowerCase() === storedName.toLowerCase()
                                    ? 'bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200'
                                    : 'bg-slate-50 border border-slate-100'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">👤</span>
                                        <span className="font-semibold text-slate-800">{driver.name}</span>
                                        {driver.name.toLowerCase() === storedName.toLowerCase() && (
                                            <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">
                                                C'est vous !
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-lg">
                                            {driver.seats || 1} place{(driver.seats || 1) > 1 ? 's' : ''}
                                        </span>
                                        {(driver.name.toLowerCase() === storedName.toLowerCase() || isAdmin) && (
                                            <button
                                                onClick={() => handleRemove(driver.id, driver.name)}
                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                aria-label="Se désinscrire"
                                            >
                                                ✕
                                            </button>
                                        )}
                                        {/* Identity recovery button - only shows if user has a stored name that matches */}
                                        {storedName && driver.name.toLowerCase() !== storedName.toLowerCase() &&
                                            driver.name.toLowerCase().includes(storedName.toLowerCase().split(' ')[0]) && !isAdmin && (
                                                <button
                                                    onClick={() => {
                                                        setStoredName(driver.name);
                                                        setName(driver.name);
                                                    }}
                                                    className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 
                                                   hover:bg-amber-200 rounded-lg transition-colors"
                                                    title="Récupérer cette inscription"
                                                >
                                                    C'est moi ?
                                                </button>
                                            )}
                                    </div>
                                </div>
                                {driver.departureLocation && (
                                    <p className="mt-1 text-sm text-slate-500 flex items-center gap-1">
                                        <span>📍</span> Départ: {driver.departureLocation}
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
                <div className="mb-4">
                    <h5 className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2">
                        <span>🙋</span> Passagers ({passengers.length})
                    </h5>
                    <div className="space-y-2">
                        {passengers.map((passenger) => (
                            <div
                                key={passenger.id}
                                className={`p-3 rounded-xl transition-all ${passenger.name.toLowerCase() === storedName.toLowerCase()
                                    ? 'bg-gradient-to-r from-amber-50 to-orange-50 border-2 border-amber-200'
                                    : 'bg-slate-50 border border-slate-100'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg">👤</span>
                                        <span className="font-semibold text-slate-800">{passenger.name}</span>
                                        <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs font-bold rounded-lg">
                                            cherche {passenger.seats || 1} place{(passenger.seats || 1) > 1 ? 's' : ''}
                                        </span>
                                        {passenger.name.toLowerCase() === storedName.toLowerCase() && (
                                            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-bold rounded-full">
                                                C'est vous !
                                            </span>
                                        )}
                                    </div>
                                    {(passenger.name.toLowerCase() === storedName.toLowerCase() || isAdmin) && (
                                        <button
                                            onClick={() => handleRemove(passenger.id, passenger.name)}
                                            className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                            aria-label="Se désinscrire"
                                        >
                                            ✕
                                        </button>
                                    )}
                                    {/* Identity recovery button - only shows if user has a stored name that matches */}
                                    {storedName && passenger.name.toLowerCase() !== storedName.toLowerCase() &&
                                        passenger.name.toLowerCase().includes(storedName.toLowerCase().split(' ')[0]) && !isAdmin && (
                                            <button
                                                onClick={() => {
                                                    setStoredName(passenger.name);
                                                    setName(passenger.name);
                                                }}
                                                className="px-2 py-1 text-xs font-medium text-amber-700 bg-amber-100 
                                               hover:bg-amber-200 rounded-lg transition-colors"
                                                title="Récupérer cette inscription"
                                            >
                                                C'est moi ?
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
                <p className="text-center text-slate-400 py-4 text-sm">
                    Aucun covoiturage proposé pour le moment
                </p>
            )}

            {/* Action Buttons */}
            {!isFormOpen && (
                <div className="flex gap-3 mt-4">
                    <button
                        onClick={() => openForm('driver')}
                        className="flex-1 py-3 px-4 flex items-center justify-center gap-2
                            bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600
                            text-white font-bold rounded-xl shadow-md hover:shadow-lg
                            transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span>🚗</span>
                        <span>Je propose</span>
                    </button>
                    <button
                        onClick={() => openForm('passenger')}
                        className="flex-1 py-3 px-4 flex items-center justify-center gap-2
                            bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600
                            text-white font-bold rounded-xl shadow-md hover:shadow-lg
                            transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <span>🙋</span>
                        <span>Je cherche</span>
                    </button>
                </div>
            )}

            {/* Form */}
            {isFormOpen && (
                <form onSubmit={handleSubmit} className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                    <h5 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        {formType === 'driver' ? (
                            <><span>🚗</span> Je propose des places</>
                        ) : (
                            <><span>🙋</span> Je cherche une place</>
                        )}
                    </h5>

                    <div className="space-y-3">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Votre nom *
                            </label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="Prénom Nom"
                                required
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Phone (optional) */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                Téléphone <span className="text-slate-400">(optionnel)</span>
                            </label>
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="06 12 34 56 78"
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Seats selection - for both driver and passenger */}
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">
                                {formType === 'driver' ? 'Places disponibles' : 'Places recherchées'}
                            </label>
                            <select
                                value={seats}
                                onChange={(e) => setSeats(Number(e.target.value))}
                                className="w-full px-4 py-2.5 border border-slate-200 rounded-xl 
                                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                {(formType === 'driver' ? [1, 2, 3, 4, 5, 6, 7] : [1, 2, 3, 4]).map(n => (
                                    <option key={n} value={n}>{n} place{n > 1 ? 's' : ''}</option>
                                ))}
                            </select>
                        </div>

                        {/* Driver-specific fields */}
                        {formType === 'driver' && (
                            <div>
                                <label className="block text-sm font-medium text-slate-600 mb-1">
                                    Lieu de départ <span className="text-slate-400">(optionnel)</span>
                                </label>
                                <input
                                    type="text"
                                    value={departureLocation}
                                    onChange={(e) => setDepartureLocation(e.target.value)}
                                    placeholder="Ex: Gerzat, Clermont centre..."
                                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl 
                                        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}
                    </div>

                    {/* Form Actions */}
                    <div className="flex gap-3 mt-4">
                        <button
                            type="button"
                            onClick={() => setIsFormOpen(false)}
                            className="flex-1 py-2.5 px-4 bg-slate-200 hover:bg-slate-300 
                                text-slate-700 font-semibold rounded-xl transition-colors"
                        >
                            Annuler
                        </button>
                        <button
                            type="submit"
                            className={`flex-1 py-2.5 px-4 text-white font-bold rounded-xl 
                                transition-all hover:shadow-lg ${formType === 'driver'
                                    ? 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600'
                                    : 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600'
                                }`}
                        >
                            Confirmer
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
});

CarpoolingSection.displayName = 'CarpoolingSection';

export default CarpoolingSection;
