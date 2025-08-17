import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { CreateGalleryDto } from '../dto/create-gallery.dto';
import { GalleryModel } from '../models/gallery.model';

@Injectable()
export class GalleriesService {
  private galleries: GalleryModel[] = [];

  findAll(): GalleryModel[] {
    return [...this.galleries].sort((a, b) => a.order - b.order);
  }

  create(dto: CreateGalleryDto): GalleryModel {
    const gallery: GalleryModel = {
      id: randomUUID(),
      title: dto.title,
      images: dto.images,
      order: this.galleries.length,
    };
    this.galleries.push(gallery);
    return gallery;
  }

  remove(id: string): void {
    this.galleries = this.galleries.filter((g) => g.id !== id);
  }

  reorder(order: string[]): void {
    this.galleries.sort(
      (a, b) => order.indexOf(a.id) - order.indexOf(b.id)
    );
    this.galleries.forEach(
      (g, idx) =>
        (g.order = idx)
    );
  }
}
