import { describe, it, expect } from 'vitest';
import { filterJobs, sortByNewest, formatPostedDate } from './jobs';
import type { Job } from '../types/job';

function makeJob(slug: string, postedDate: string): Job {
    return {
        slug,
        title: `Role ${slug}`,
        department: 'Technology',
        location: 'Remote',
        type: 'Full-time',
        remote: true,
        postedDate,
        summary: 'A role.',
    };
}

describe('sortByNewest', () => {
    it('orders jobs by posted date, newest first', () => {
        const jobs = [
            makeJob('a', '2027-01-01'),
            makeJob('b', '2027-03-15'),
            makeJob('c', '2027-02-10'),
        ];
        expect(sortByNewest(jobs).map((j) => j.slug)).toEqual(['b', 'c', 'a']);
    });

    it('does not mutate the input array', () => {
        const jobs = [makeJob('a', '2027-01-01'), makeJob('b', '2027-03-15')];
        const original = jobs.map((j) => j.slug);
        sortByNewest(jobs);
        expect(jobs.map((j) => j.slug)).toEqual(original);
    });
});

describe('filterJobs', () => {
    const jobs = [
        { ...makeJob('a', '2027-01-01'), department: 'Technology', location: 'Remote' },
        { ...makeJob('b', '2027-01-02'), department: 'Technology', location: 'London' },
        { ...makeJob('c', '2027-01-03'), department: 'Finance', location: 'Remote' },
    ];

    it('filters by department', () => {
        expect(filterJobs(jobs, { department: 'Technology' }).map((job) => job.slug)).toEqual([
            'a',
            'b',
        ]);
    });

    it('filters by location', () => {
        expect(filterJobs(jobs, { location: 'Remote' }).map((job) => job.slug)).toEqual([
            'a',
            'c',
        ]);
    });

    it('requires both department and location to match when both are selected', () => {
        expect(
            filterJobs(jobs, { department: 'Technology', location: 'Remote' }).map(
                (job) => job.slug,
            ),
        ).toEqual(['a']);
    });

    it('returns all jobs when filters are reset', () => {
        expect(filterJobs(jobs).map((job) => job.slug)).toEqual(['a', 'b', 'c']);
        expect(filterJobs(jobs, { department: '', location: '' })).toEqual(jobs);
    });

    it('returns no jobs when the selected combination has no matches', () => {
        expect(filterJobs(jobs, { department: 'Finance', location: 'London' })).toEqual([]);
    });
});

describe('formatPostedDate', () => {
    it('formats an ISO date as a readable string', () => {
        expect(formatPostedDate('2027-01-05')).toBe('January 5, 2027');
    });

    it('returns the raw value when the date is unparseable', () => {
        expect(formatPostedDate('not-a-date')).toBe('not-a-date');
    });
});
