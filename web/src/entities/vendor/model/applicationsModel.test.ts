import { describe, expect, it } from 'vitest';
import { seedApplications } from '../api/applicationSeed';
import { ownerMatch } from './applicationsModel';

describe('applications model', () => {
  it('matches the owner on paper with the chip, ignoring case', () => {
    expect(ownerMatch(seedApplications[0])).toEqual({ name: true, id: true });
    expect(ownerMatch(seedApplications[2])).toEqual({ name: true, id: false });
  });
});
