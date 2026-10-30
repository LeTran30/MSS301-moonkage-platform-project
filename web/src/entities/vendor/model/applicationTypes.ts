export type ApplicationState = 'pending' | 'needs-more' | 'approved' | 'locked' | 'rejected';

export interface VendorApplication {
  id: string;
  /** Account of the applicant (demo: links the decision to the vendor channel). */
  account: string;
  shopName: string;
  kind: string;
  city: string;
  ways: string;
  attempt: number;
  submittedAt: string;
  waiting: string;
  regNo: string;
  address: string;
  source: string;
  ownerOnPaper: { name: string; id: string };
  ownerOnChip: { name: string; id: string };
  state: ApplicationState;
  history: { label: string; at: string }[];
}
