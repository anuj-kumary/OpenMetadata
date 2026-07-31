/*
 *  Copyright 2025 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { EntityType } from '../enums/entity.enum';
import { QueryFilterInterface } from '../pages/ExplorePage/ExplorePage.interface';
import { getEntityTypeAggregationFilter } from './QueryBuilderPureUtils';

const makeBaseFilter = (): QueryFilterInterface => ({
  query: {
    bool: {
      must: [
        {
          bool: {
            must: [
              {
                term: { 'domain.fullyQualifiedName': 'business-performance' },
              },
            ],
          },
        },
      ],
    },
  },
});

describe('getEntityTypeAggregationFilter', () => {
  it('does not add an entityType clause when entityType is EntityType.ALL (scalar)', () => {
    const filter = makeBaseFilter();
    const result = getEntityTypeAggregationFilter(filter, EntityType.ALL);

    const innerMust = (result.query?.bool?.must as { bool: { must: unknown[] } }[])[0]?.bool?.must;

    expect(
      innerMust?.some(
        (clause) =>
          (clause as { term?: Record<string, unknown> })?.term?.[
            'entityType.keyword'
          ] !== undefined ||
          (clause as { terms?: Record<string, unknown> })?.terms?.[
            'entityType.keyword'
          ] !== undefined
      )
    ).toBe(false);
  });

  it('does not add an entityType clause when the array contains EntityType.ALL', () => {
    const filter = makeBaseFilter();
    const result = getEntityTypeAggregationFilter(filter, [EntityType.ALL]);

    const innerMust = (result.query?.bool?.must as { bool: { must: unknown[] } }[])[0]?.bool?.must;

    expect(
      innerMust?.some(
        (clause) =>
          (clause as { term?: Record<string, unknown> })?.term?.[
            'entityType.keyword'
          ] !== undefined ||
          (clause as { terms?: Record<string, unknown> })?.terms?.[
            'entityType.keyword'
          ] !== undefined
      )
    ).toBe(false);
  });

  it('adds a single term clause for one concrete entity type', () => {
    const filter = makeBaseFilter();
    const result = getEntityTypeAggregationFilter(filter, EntityType.TABLE);

    const innerMust = (result.query?.bool?.must as { bool: { must: unknown[] } }[])[0]?.bool?.must;
    const termClause = innerMust?.find(
      (clause) =>
        (clause as { term?: Record<string, unknown> })?.term?.[
          'entityType.keyword'
        ] !== undefined
    ) as { term: Record<string, unknown> } | undefined;

    expect(termClause?.term?.['entityType.keyword']).toBe(EntityType.TABLE);
  });

  it('uses terms (OR) semantics for multiple concrete entity types', () => {
    const filter = makeBaseFilter();
    const result = getEntityTypeAggregationFilter(filter, [
      EntityType.TABLE,
      EntityType.TOPIC,
    ]);

    const innerMust = (result.query?.bool?.must as { bool: { must: unknown[] } }[])[0]?.bool?.must;
    const termsClause = innerMust?.find(
      (clause) =>
        (clause as { terms?: Record<string, unknown> })?.terms?.[
          'entityType.keyword'
        ] !== undefined
    ) as { terms: Record<string, unknown[]> } | undefined;

    expect(termsClause?.terms?.['entityType.keyword']).toEqual([
      EntityType.TABLE,
      EntityType.TOPIC,
    ]);
  });

  it('filters out ALL from a mixed array and uses remaining types', () => {
    const filter = makeBaseFilter();
    const result = getEntityTypeAggregationFilter(filter, [
      EntityType.ALL,
      EntityType.TABLE,
    ]);

    const innerMust = (result.query?.bool?.must as { bool: { must: unknown[] } }[])[0]?.bool?.must;
    const termClause = innerMust?.find(
      (clause) =>
        (clause as { term?: Record<string, unknown> })?.term?.[
          'entityType.keyword'
        ] !== undefined
    ) as { term: Record<string, unknown> } | undefined;

    expect(termClause?.term?.['entityType.keyword']).toBe(EntityType.TABLE);
  });

  it('returns the filter unchanged when qFilter has no must array', () => {
    const filter: QueryFilterInterface = { query: { bool: {} } };
    const result = getEntityTypeAggregationFilter(filter, EntityType.TABLE);

    expect(result).toEqual(filter);
  });
});
