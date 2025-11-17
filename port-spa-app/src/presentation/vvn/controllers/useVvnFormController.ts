import { useState, useEffect } from 'react';
import { useNavigate, useParams} from 'react-router-dom';
import { VvnService } from '../../../app/vvn/vvn.service';
import { vvnApiRepository } from '../../../infrastructure/repositories/vvn/vvnApi.repository';
import type { CreateVvnDto} from '../../../infrastructure/repositories/vvn/vvn.dto';
import { useAuth } from '../../../auth/AuthProvider';

// Create the service instance
const vvnService = new VvnService(vvnApiRepository);

// Match the original initialState with rich test data
const initialState: CreateVvnDto = {
    estimatedArrival: '2025-11-14T12:00',
    estimatedDeparture: '2025-11-14T20:00',
    vesselImo: '9319466',
    representativeCitizenId: 'AC1234567',
    cargo: {
        description: 'Initial Cargo Load',
        weight: 12000,
        containers: [
            {
                containerCode: 'CSQU3054383',
                position: 'Bay 01, Row 01, Tier 01',
            },
        ],
    },
    crewMembers: [
        {
            name: 'Captain Jack',
            nationality: 'British',
            isSafetyOfficer: false,
        },
        {
            name: 'Officer Jane',
            nationality: 'American',
            isSafetyOfficer: true,
        },
    ],
};

// This is the Controller for the FORM page
export const useVvnFormController = () => {
    const navigate = useNavigate();
    const { citizenId } = useAuth();
    const { id } = useParams<{ id: string }>(); // 'id' is the businessId
    const isEditMode = Boolean(id);
    

    // 1. All state is moved here
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<CreateVvnDto>({
        ...initialState,
        representativeCitizenId: citizenId ?? 'AC1234567',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isLoading, setIsLoading] = useState(isEditMode);
    const [error, setError] = useState<string | null>(null);

    // 2. Data fetching logic is here
    useEffect(() => {
        if (isEditMode && id) {
            const fetchVvn = async () => {
                try {
                    const vvn = await vvnService.getVvnById(id);
                    const formatDt = (dt: string | null | undefined) =>
                        dt ? dt.substring(0, 16) : '';
                    setFormData({
                        estimatedArrival: formatDt(vvn.estimatedArrival),
                        estimatedDeparture: formatDt(vvn.estimatedDeparture),
                        vesselImo: vvn.vesselImo,
                        representativeCitizenId: citizenId ?? 'AC1234567',
                        cargo: vvn.cargo,
                        crewMembers: vvn.crewMembers,
                    });
                } catch (err: any) {
                    setError('Failed to load vessel notification data.');
                } finally {
                    setIsLoading(false);
                }
            };
            fetchVvn();
        }
    }, [id, isEditMode, citizenId]);

    // 3. All form handlers are here
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleCargoChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            cargo: {
                ...prev.cargo,
                [name]: name === 'weight' ? Number(value) : value,
            },
        }));
    };

    const addContainer = () =>
        setFormData((prev) => ({
            ...prev,
            cargo: {
                ...prev.cargo,
                containers: [
                    ...prev.cargo.containers,
                    { containerCode: '', position: '' },
                ],
            },
        }));

    const removeContainer = (index: number) =>
        setFormData((prev) => ({
            ...prev,
            cargo: {
                ...prev.cargo,
                containers: prev.cargo.containers.filter((_, i) => i !== index),
            },
        }));

    const handleContainerChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value } = e.target;
        const updatedContainers = formData.cargo.containers.map((item, i) =>
            i === index ? { ...item, [name]: value } : item,
        );
        setFormData((prev) => ({
            ...prev,
            cargo: { ...prev.cargo, containers: updatedContainers },
        }));
    };

    const addCrewMember = () =>
        setFormData((prev) => ({
            ...prev,
            crewMembers: [
                ...prev.crewMembers,
                { name: '', nationality: '', isSafetyOfficer: false },
            ],
        }));

    const removeCrewMember = (index: number) =>
        setFormData((prev) => ({
            ...prev,
            crewMembers: prev.crewMembers.filter((_, i) => i !== index),
        }));

    const handleCrewChange = (
        index: number,
        e: React.ChangeEvent<HTMLInputElement>,
    ) => {
        const { name, value, type, checked } = e.target;
        const updatedCrew = formData.crewMembers.map((member, i) =>
            i === index
                ? { ...member, [name]: type === 'checkbox' ? checked : value }
                : member,
        );
        setFormData((prev) => ({
            ...prev,
            crewMembers: updatedCrew,
        }));
    };

    // 4. Submit logic is here
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (
            !formData.vesselImo ||
            !formData.estimatedArrival ||
            !formData.estimatedDeparture
        ) {
            setError('Vessel IMO, ETA, and ETD are required.');
            setStep(1);
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            if (isEditMode && id) {
                await vvnService.updateVvn(id, formData);
            } else {
                await vvnService.createVvn(formData);
            }
            navigate('/vessel-visits');
        } catch (err: any) {
            setError(
                err.message ||
                `Failed to ${isEditMode ? 'update' : 'create'} notification.`,
            );
            setIsSubmitting(false);
        }
    };

    // 5. Return everything the View needs
    return {
        // State
        step,
        setStep,
        formData,
        isEditMode,
        isLoading,
        isSubmitting,
        error,

        // Handlers
        navigate,
        handleSubmit,
        handleChange,
        handleCargoChange,
        handleContainerChange,
        addContainer,
        removeContainer,
        handleCrewChange,
        addCrewMember,
        removeCrewMember,
    };
};