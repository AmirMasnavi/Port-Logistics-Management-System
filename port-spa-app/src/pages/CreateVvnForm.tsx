// // src/pages/CreateVvnForm.tsx
// import React, { useState } from 'react';
// import { createVvn } from '../services/apiService';
// import type { VesselVisitNotification, CreateVvnDto } from '../types';
// import { Ship, Package, Users, Plus, Trash2 } from 'lucide-react';
//
// interface CreateVvnFormProps {
//     onClose: () => void;
//     onSuccess: (newVvn: VesselVisitNotification) => void;
//     dummyRepresentativeId: string;
// }
//
// // --- Reusable Styled Form Components ---
// const Input: React.FC<React.InputHTMLAttributes<HTMLInputElement> & { label: string }> = ({ label, id, ...props }) => (
//     <div>
//         <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
//         <input
//             id={id} 
//             {...props}
//             className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
//         />
//     </div>
// );
//
// const Textarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }> = ({ label, id, ...props }) => (
//     <div>
//         <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
//         <textarea
//             id={id}
//             {...props}
//             className="mt-1 p-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-maritime-500"
//         />
//     </div>
// );
//
// // --- Main Form Component ---
// const initialState: CreateVvnDto = {
//     estimatedArrival: '',
//     estimatedDeparture: '',
//     vesselImo: '',
//     representativeId: '',
//     cargo: {
//         description: '',
//         weight: 0,
//         containers: [],
//     },
//     crewMembers: [],
// };
//
// const CreateVvnForm: React.FC<CreateVvnFormProps> = ({ onClose, onSuccess, dummyRepresentativeId }) => {
//     const [step, setStep] = useState(1);
//     const [formData, setFormData] = useState<CreateVvnDto>({
//         ...initialState,
//         representativeId: dummyRepresentativeId,
//     });
//     const [isSubmitting, setIsSubmitting] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//
//     // --- Handlers for simple root fields ---
//     const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({ ...prev, [name]: value }));
//     };
//
//     // --- Handlers for nested CARGO fields ---
//     const handleCargoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
//         const { name, value } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             cargo: {
//                 ...prev.cargo,
//                 [name]: name === 'weight' ? Number(value) : value,
//             },
//         }));
//     };
//
//     // --- Handlers for CONTAINER list ---
//     const addContainer = () => {
//         setFormData(prev => ({
//             ...prev,
//             cargo: {
//                 ...prev.cargo,
//                 containers: [...prev.cargo.containers, { containerCode: '', position: '' }],
//             },
//         }));
//     };
//
//     const handleContainerChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value } = e.target;
//         const updatedContainers = formData.cargo.containers.map((item, i) =>
//             i === index ? { ...item, [name]: value } : item
//         );
//         setFormData(prev => ({
//             ...prev,
//             cargo: { ...prev.cargo, containers: updatedContainers },
//         }));
//     };
//
//     const removeContainer = (index: number) => {
//         setFormData(prev => ({
//             ...prev,
//             cargo: {
//                 ...prev.cargo,
//                 containers: prev.cargo.containers.filter((_, i) => i !== index),
//             },
//         }));
//     };
//
//     // --- Handlers for CREW list ---
//     const addCrewMember = () => {
//         setFormData(prev => ({
//             ...prev,
//             crewMembers: [...prev.crewMembers, { name: '', nationality: '', isSafetyOfficer: false }],
//         }));
//     };
//
//     const handleCrewChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
//         const { name, value, type, checked } = e.target;
//         const updatedCrew = formData.crewMembers.map((member, i) =>
//             i === index
//                 ? { ...member, [name]: type === 'checkbox' ? checked : value }
//                 : member
//         );
//         setFormData(prev => ({
//             ...prev,
//             crewMembers: updatedCrew,
//         }));
//     };
//
//     const removeCrewMember = (index: number) => {
//         setFormData(prev => ({
//             ...prev,
//             crewMembers: prev.crewMembers.filter((_, i) => i !== index),
//         }));
//     };
//
//
//     // --- Form Submission ---
//     const handleSubmit = async (e: React.FormEvent) => {
//         e.preventDefault();
//         if (!formData.vesselImo || !formData.estimatedArrival || !formData.estimatedDeparture) {
//             setError("Vessel IMO, ETA, and ETD are required.");
//             setStep(1); // Go back to first step if validation fails
//             return;
//         }
//
//         setIsSubmitting(true);
//         setError(null);
//         try {
//             const newVvn = await createVvn(formData); // [cite: 1251-1252]
//             onSuccess(newVvn);
//             onClose();
//         } catch (err: any) {
//             setError(err.response?.data?.message || 'Failed to create notification. Check all fields.');
//             setIsSubmitting(false);
//         }
//     };
//
//     const steps = [
//         { name: 'Visit Details', icon: Ship },
//         { name: 'Cargo', icon: Package },
//         { name: 'Crew', icon: Users },
//     ];
//
//     return (
//         <form onSubmit={handleSubmit} className="space-y-6">
//             {/* --- 1. Step Indicator --- */}
//             <nav className="flex items-center justify-center space-x-4 border-b border-gray-200 pb-4">
//                 {steps.map((item, index) => {
//                     const stepNumber = index + 1;
//                     const isCompleted = step < stepNumber;
//                     const isCurrent = step === stepNumber;
//
//                     return (
//                         <div key={item.name} className="flex items-center gap-2">
//                             <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
//                                 isCurrent ? 'bg-maritime-500 text-white' : isCompleted ? 'bg-gray-200 text-gray-600' : 'bg-green-500 text-white'
//                             }`}>
//                                 <item.icon className="w-5 h-5" />
//                             </div>
//                             <span className={`font-medium ${isCurrent ? 'text-maritime-600' : 'text-gray-600'}`}>
//                                 {item.name}
//                             </span>
//                         </div>
//                     );
//                 })}
//             </nav>
//
//             {error && <div className="text-red-600 p-3 bg-red-100 rounded-lg">{error}</div>}
//
//             {/* --- 2. Form Content (Conditional) --- */}
//             <div className="max-h-[60vh] overflow-y-auto p-1 space-y-4">
//                 {/* --- Step 1: Visit Details --- */}
//                 {step === 1 && (
//                     <div className="space-y-4">
//                         <Input label="Vessel IMO" id="vesselImo" name="vesselImo" value={formData.vesselImo} onChange={handleChange} required />
//                         <div className="grid grid-cols-2 gap-4">
//                             <Input label="Estimated Arrival (ETA)" id="estimatedArrival" name="estimatedArrival" type="datetime-local" value={formData.estimatedArrival} onChange={handleChange} required />
//                             <Input label="Estimated Departure (ETD)" id="estimatedDeparture" name="estimatedDeparture" type="datetime-local" value={formData.estimatedDeparture} onChange={handleChange} required />
//                         </div>
//                     </div>
//                 )}
//
//                 {/* --- Step 2: Cargo --- */}
//                 {step === 2 && (
//                     <div className="space-y-4">
//                         <Textarea label="Cargo Description" id="description" name="description" value={formData.cargo.description} onChange={handleCargoChange} />
//                         <Input label="Cargo Weight (kg)" id="weight" name="weight" type="number" value={formData.cargo.weight} onChange={handleCargoChange} />
//
//                         <div>
//                             <h4 className="text-md font-medium text-gray-800 mb-2">Containers</h4>
//                             {formData.cargo.containers.map((container, index) => (
//                                 <div key={index} className="flex items-center gap-2 mb-2 p-3 border rounded-lg bg-gray-50">
//                                     <Input label={`Code #${index + 1}`} id={`containerCode-${index}`} name="containerCode" placeholder="CSQU3054383" value={container.containerCode} onChange={(e) => handleContainerChange(index, e)} required />
//                                     <Input label="Position" id={`position-${index}`} name="position" placeholder="B1-R1-T1" value={container.position} onChange={(e) => handleContainerChange(index, e)} />
//                                     <button type="button" onClick={() => removeContainer(index)} className="mt-8 p-2 text-red-500 hover:text-red-700">
//                                         <Trash2 className="w-5 h-5" />
//                                     </button>
//                                 </div>
//                             ))}
//                             <button type="button" onClick={addContainer} className="btn btn-secondary mt-2">
//                                 <Plus className="w-4 h-4" /> Add Container
//                             </button>
//                         </div>
//                     </div>
//                 )}
//
//                 {/* --- Step 3: Crew --- */}
//                 {step === 3 && (
//                     <div className="space-y-4">
//                         <h4 className="text-md font-medium text-gray-800 mb-2">Crew Members</h4>
//                         {formData.crewMembers.map((crew, index) => (
//                             <div key={index} className="flex items-center gap-2 mb-2 p-3 border rounded-lg bg-gray-50">
//                                 <Input label={`Name #${index + 1}`} id={`crewName-${index}`} name="name" placeholder="John Doe" value={crew.name} onChange={(e) => handleCrewChange(index, e)} required />
//                                 <Input label="Nationality" id={`crewNat-${index}`} name="nationality" placeholder="Portuguese" value={crew.nationality} onChange={(e) => handleCrewChange(index, e)} required />
//                                 <div className="mt-8 flex items-center">
//                                     <input type="checkbox" id={`isSafetyOfficer-${index}`} name="isSafetyOfficer" checked={crew.isSafetyOfficer} onChange={(e) => handleCrewChange(index, e)} className="h-4 w-4 rounded" />
//                                     <label htmlFor={`isSafetyOfficer-${index}`} className="ml-2 text-sm text-gray-700">Safety Officer</label>
//                                 </div>
//                                 <button type="button" onClick={() => removeCrewMember(index)} className="mt-8 p-2 text-red-500 hover:text-red-700">
//                                     <Trash2 className="w-5 h-5" />
//                                 </button>
//                             </div>
//                         ))}
//                         <button type="button" onClick={addCrewMember} className="btn btn-secondary mt-2">
//                             <Plus className="w-4 h-4" /> Add Crew Member
//                         </button>
//                     </div>
//                 )}
//             </div>
//
//             {/* --- 3. Navigation Buttons --- */}
//             <div className="flex justify-between space-x-2 pt-4 border-t">
//                 <button
//                     type="button"
//                     onClick={onClose}
//                     className="btn bg-gray-200 hover:bg-gray-300 text-gray-800"
//                 >
//                     Cancel
//                 </button>
//                 <div className="flex gap-2">
//                     {step > 1 && (
//                         <button
//                             type="button"
//                             onClick={() => setStep(s => s - 1)}
//                             className="btn btn-secondary"
//                         >
//                             Back
//                         </button>
//                     )}
//                     {step < 3 && (
//                         <button
//                             type="button"
//                             onClick={() => setStep(s => s + 1)}
//                             className="btn btn-primary"
//                         >
//                             Next
//                         </button>
//                     )}
//                     {step === 3 && (
//                         <button
//                             type="submit"
//                             disabled={isSubmitting}
//                             className="btn btn-primary"
//                         >
//                             {isSubmitting ? 'Creating...' : 'Create Notification'}
//                         </button>
//                     )}
//                 </div>
//             </div>
//         </form>
//     );
// };
//
// export default CreateVvnForm;