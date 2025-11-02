import { Hotel } from "../../../shared/models/hotel.model";

export class HotelFactory {
  static fromDto(dto: any): Hotel {
    return {
      id: dto.id,
      name: dto.name,
      image: dto.image,
      address: dto.address,
      stars: dto.stars,
      rate: dto.rate,
      price: dto.price,
    };
  }

  static fromDtoArray(dtos: any[]): Hotel[] {
    return dtos.map(dto => HotelFactory.fromDto(dto));
  }
}
