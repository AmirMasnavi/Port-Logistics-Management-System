import type {VesselVisitNotification} from '../../../domain/vvn/vvn.model';

// In a simple project, the API DTO might be identical to the Domain Model.
// If so, the mapper is very simple.
// If the API returned "vessel_imo" but our domain model used "vesselImo",
// this file would do that translation.

// For now, we assume the API DTO for a GET request is the same
// as our Domain Model.
export class VvnMapper {
    public static toDomain(apiDto: any): VesselVisitNotification {
        // If translation was needed, it would happen here.
        // e.g., const domainModel = {
        //   businessId: apiDto.business_id,
        //   vesselImo: apiDto.vessel_imo,
        //   ...
        // }
        // return domainModel;

        return apiDto as VesselVisitNotification;
    }

    public static toDomainList(apiDtoList: any[]): VesselVisitNotification[] {
        return apiDtoList.map(this.toDomain);
    }
}