import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, PipelineStage, Types } from 'mongoose';
import { Priority } from '../../common/enums/priority.enum';
import { RequestStatus } from '../../common/enums/request-status.enum';
import { Category } from '../categories/schemas/category.model';
import { ServiceRequest } from '../requests/schemas/service-request.model';
import { GroupCount, toPriorityCounts, toStatusCounts } from './dashboard-counts';
import { CategoryCount, DashboardCounts } from './dashboard.types';

interface CountsFacets {
  total: Array<{ count: number }>;
  byStatus: GroupCount<RequestStatus>[];
  byPriority: GroupCount<Priority | null>[];
  byCategory: Array<{ _id: Types.ObjectId; name: string; count: number }>;
}

type FacetStage = PipelineStage.FacetPipelineStage;

const countBy = (field: string): FacetStage[] => [
  { $group: { _id: `$${field}`, count: { $sum: 1 } } },
];

@Injectable()
export class DashboardRepository {
  private readonly categoriesCollection: string;

  constructor(
    @InjectModel(ServiceRequest.name) private readonly requestModel: Model<ServiceRequest>,
    @InjectModel(Category.name) categoryModel: Model<Category>,
  ) {
    this.categoriesCollection = categoryModel.collection.collectionName;
  }

  // One round trip: every count comes from the same $facet (aggregate does not cast ids).
  async countRequests(scope: { ownerId?: string }): Promise<DashboardCounts> {
    const match = scope.ownerId ? { createdBy: new Types.ObjectId(scope.ownerId) } : {};
    const [facets] = await this.requestModel.aggregate<CountsFacets>([
      { $match: match },
      {
        $facet: {
          total: [{ $count: 'count' }],
          byStatus: countBy('status'),
          byPriority: countBy('priority'),
          byCategory: this.categoryCountStages(),
        },
      },
    ]);
    return {
      total: facets.total[0]?.count ?? 0,
      byStatus: toStatusCounts(facets.byStatus),
      byPriority: toPriorityCounts(facets.byPriority),
      byCategory: facets.byCategory.map(toCategoryCount),
    };
  }

  private categoryCountStages(): FacetStage[] {
    return [
      ...countBy('category'),
      {
        $lookup: {
          from: this.categoriesCollection,
          localField: '_id',
          foreignField: '_id',
          as: 'category',
        },
      },
      { $unwind: '$category' },
      { $project: { count: 1, name: '$category.name' } },
      { $sort: { count: -1, name: 1 } },
    ];
  }
}

function toCategoryCount({ _id, name, count }: CountsFacets['byCategory'][number]): CategoryCount {
  return { categoryId: _id.toString(), name, count };
}
