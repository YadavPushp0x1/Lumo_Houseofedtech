export type Course = {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  price?: number;
  rating?: number;
  category?: string;
  images?: string[];
  instructorName: string;
  instructorAvatar?: string;
};

