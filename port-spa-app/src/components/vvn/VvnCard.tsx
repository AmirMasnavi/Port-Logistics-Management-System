// src/components/vvn/VvnCard.tsx
import React from 'react';
import type { VesselVisitNotification } from '../../types';
import Badge from '../common/Badge'; // We use the Badge you already have [cite: 171]
import { ChevronRight, Ship, Calendar, Anchor, User } from 'lucide-react';

// Define the props the card will accept
interface VvnCardProps {
    vvn: VesselVisitNotification;
    onSelect: (vvn: VesselVisitNotification) => void; // Function to run when clicked
}

// A small helper to format the date
const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('en-CA', { // 'en-CA' gives YYYY-MM-DD
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
        });
    } catch (e) {
        return 'Invalid Date';
    }
};

const VvnCard: React.FC<VvnCardProps> = ({ vvn, onSelect }) => {
    // ---
    // NOTE: Your target image shows "MV Pacific" and "Ocean Shipping Co."
    // Your 'VesselVisitNotification' type only has 'vesselImo' [cite: 83] and a 'submittedBy' GUID[cite: 83].
    // For now, this card will display the real data. We can fetch the names later.
    // ---

    // We'll use the IMO as the title for now
    const title = `Vessel: ${vvn.vesselImo}`;
    const arrivalDate = formatDate(vvn.estimatedArrival);
    const dock = vvn.assignedDockId || 'N/A'; // [cite: 84, 600]
    const submittedBy = vvn.submittedBy; // This is just a GUID for now

    return (
        <div
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4 transition-all hover:shadow-md"
        >
            {/* Card Header: Title and Status Badge */}
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">{title}</h2>
                <Badge status={vvn.status} />
            </div>

            {/* Card Body: The 4-column data grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <InfoItem icon={Ship} title="IMO Number" value={vvn.vesselImo} />
                <InfoItem icon={Calendar} title="Arrival Date" value={arrivalDate} />
                <InfoItem icon={Anchor} title="Assigned Dock" value={dock} />
                <InfoItem icon={User} title="Submitted By" value={submittedBy.substring(0, 8)} />
            </div>

            {/* Action Button: Arrow (on desktop) */}
            {/* On mobile, the whole card can be clickable */}
            <button
                onClick={() => onSelect(vvn)}
                className="absolute top-1/2 -translate-y-1/2 right-4 p-2 rounded-full hover:bg-gray-100 hidden md:block"
                title="View Details"
            >
                <ChevronRight className="w-6 h-6 text-gray-500" />
            </button>

            {/* We make the whole card clickable on mobile */}
            <button
                onClick={() => onSelect(vvn)}
                className="w-full text-center p-2 mt-4 bg-gray-50 rounded-lg text-sm font-medium text-maritime-700 md:hidden"
            >
                View Details
            </button>
        </div>
    );
};

// Helper component for the items in the grid
const InfoItem: React.FC<{ icon: React.ComponentType<{ className?: string }>, title: string, value: string }> = ({ icon: Icon, title, value }) => (
    <div className="flex flex-col">
        <div className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
            <Icon className="w-3 h-3" />
            {title}
        </div>
        <div className="text-sm font-semibold text-gray-900 mt-1 truncate" title={value}>
            {value}
        </div>
    </div>
);
export default VvnCard;