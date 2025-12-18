import React from 'react';
import { History, User, Clock, FileText } from 'lucide-react';

interface ChangeLogEntry {
    author: string;
    reason: string;
    details: string;
    timestamp: string;
    _id?: string;
}

interface ChangeLogListProps {
    logs: ChangeLogEntry[];
}

const ChangeLogList: React.FC<ChangeLogListProps> = ({ logs }) => {
    if (!logs || logs.length === 0) return null;

    // Sort logs by timestamp descending (newest first)
    const sortedLogs = [...logs].sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return (
        <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-2">
                <History className="w-5 h-5 text-gray-500" />
                <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Audit Trail & Change Logs</h3>
                <span className="ml-auto bg-gray-200 text-gray-600 text-xs font-medium px-2.5 py-0.5 rounded-full">
                    {logs.length} Changes
                </span>
            </div>
            
            <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto">
                {sortedLogs.map((log, idx) => (
                    <div key={log._id || idx} className="p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 bg-blue-100 p-1.5 rounded-full">
                                <FileText className="w-4 h-4 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 mb-1">
                                    {log.reason}
                                </p>
                                {/*<div className="text-xs text-gray-600 mb-2 space-y-1">*/}
                                {/*    {log.details.split('. ').map((detail, i) => (*/}
                                {/*        <div key={i} className="bg-gray-50 px-2 py-1 rounded border border-gray-100 inline-block mr-2">*/}
                                {/*            {detail}*/}
                                {/*        </div>*/}
                                {/*    ))}*/}
                                {/*</div>*/}
                                <div className="flex items-center gap-4 text-xs text-gray-400">
                                    <span className="flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {log.author}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(log.timestamp).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ChangeLogList;

