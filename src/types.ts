export type ContentType = 'Essay' | 'Field note' | 'Meme' | 'Demo' | 'Image artifact' | 'Project' | 'Meme archive';
export type ViewMode = 'MACHINE' | 'AUTHOR' | 'MISREAD' | 'VISUAL';
export type LayoutMode = 'FIELD' | 'RACK' | 'LIST';

export interface SemanticCoordinate {
  x: number;
  y: number;
}

export interface SemanticRelationship {
  neighborId: string;
  distance: number;
}

export type AuthorIntent = string;
export type MachineCluster = string;

export interface TraceMetadata {
  artifactID: string;
  contentType: ContentType;
  dateCaptured?: string;
  datePublished: string;
  authorIntent: AuthorIntent;
  machineCluster: MachineCluster;
  machineCoordinate: SemanticCoordinate;
  authorCoordinate: SemanticCoordinate;
  semanticDisplacement: number;
  nearestMachineNeighbors: SemanticRelationship[];
  nearestAuthorNeighbors: SemanticRelationship[];
  nearestVisualNeighbors?: SemanticRelationship[];
  writingProvenance?: string;
  imageProvenance?: string;
  modelInvolvement?: string;
  revisionCount?: number;
}

export interface Artifact {
  id: string;
  title: string;
  subtitle?: string;
  date: string;
  type: ContentType;
  mediaUrl?: string;
  excerpt: string;
  bodyMarkdown: string;
  inlineMedia?: string[];
  coverMedia?: string;
  authorIntent: AuthorIntent;
  machineCluster: MachineCluster;
  authorLocation: SemanticCoordinate;
  machineLocation: SemanticCoordinate;
  visualLocation?: SemanticCoordinate;
  trace: TraceMetadata;
  searchRelevance?: number;
  status?: ArtifactStatus;
}

export interface SearchVector {
  query: string;
  location: SemanticCoordinate;
  isActive: boolean;
}

// --- NEW TYPES FOR FIREBASE PUBLISHING SYSTEM ---

export type ArtifactStatus = 'draft' | 'published';

export interface MediaRecord {
  id: string;
  storagePath: string;
  downloadUrl: string;
  originalFilename: string;
  mimeType: string;
  size: number;
  width?: number;
  height?: number;
  altText: string;
  caption?: string;
  createdAt: number;
  ownerUid: string;
  usedByArtifactIds: string[];
}

export interface FirebaseArtifact {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  excerpt: string;
  bodyMarkdown: string;
  type: ContentType;
  status: ArtifactStatus;
  featured: boolean;
  coverMedia?: string; 
  inlineMedia: string[]; 
  authorIntent: string;
  topics: string[];
  keywords: string[];
  authorCategory: string;
  machineCluster: string;
  machineCoordinate: SemanticCoordinate;
  authorCoordinate: SemanticCoordinate;
  coordinatesProvisional: boolean;
  relatedArtifactIds: string[];
  semanticDisplacementNote?: string;
  traceMetadata: TraceMetadata;
  createdAt: number;
  updatedAt: number;
  publishedAt?: number;
  revisionCount: number;
  ownerUid: string;
}
