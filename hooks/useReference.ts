import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';

export interface RefItem { id: number; name: string; [k: string]: unknown }

const STALE = 60 * 60 * 1000; // 1 hour

function refQuery<T = RefItem>(key: (string | number | null)[], url: string, params?: Record<string, unknown>, enabled = true) {
  return useQuery<T[]>({
    queryKey: key,
    queryFn: async () => (await api.get<{ data: T[] }>(url, { params })).data.data,
    staleTime: STALE,
    enabled,
  });
}

export const useRegions   = () => refQuery(['ref', 'regions'], '/reference/regions');
export const useDistricts = (regionId: number | null) =>
  refQuery(['ref', 'districts', regionId], '/reference/districts', { region_id: regionId }, regionId !== null);
export const useChiefdoms = (districtId: number | null) =>
  refQuery(['ref', 'chiefdoms', districtId], '/reference/chiefdoms', { district_id: districtId }, districtId !== null);
export const useSections  = (chiefdomId: number | null) =>
  refQuery(['ref', 'sections', chiefdomId], '/reference/sections', { chiefdom_id: chiefdomId }, chiefdomId !== null);
export const useLocalities = (sectionId: number | null) =>
  refQuery(['ref', 'localities', sectionId], '/reference/localities', { section_id: sectionId }, sectionId !== null);

export const useGrievanceTypes = () => refQuery(['ref', 'types'], '/reference/types');
export const useHowReported    = () => refQuery(['ref', 'how-reported'], '/reference/how-reported');
export const useOrganisations  = () =>
  refQuery<{ id: number; name: string; acronym: string | null }>(
    ['ref', 'organisations'], '/reference/organisations',
  );
export const useProgrammes = (orgId: number | null) =>
  refQuery<{ id: number; name: string; acronym: string | null; organization_id: number }>(
    ['ref', 'programmes', orgId], '/reference/programmes', { organisation_id: orgId }, orgId !== null,
  );
