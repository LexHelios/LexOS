import logging
from typing import Dict, List, Optional, Union

import geopandas as gpd
import numpy as np
from shapely.geometry import Point, Polygon, LineString
from shapely.ops import unary_union
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

def load_geospatial_data(file_path: str, **kwargs) -> gpd.GeoDataFrame:
    """
    Load geospatial data from various file formats.
    
    Args:
        file_path: Path to the geospatial data file
        **kwargs: Additional arguments to pass to geopandas.read_file()
    
    Returns:
        GeoDataFrame containing the loaded data
    """
    try:
        return gpd.read_file(file_path, **kwargs)
    except Exception as e:
        logger.error(f"Failed to load geospatial data from {file_path}: {str(e)}")
        raise

def reproject_data(gdf: gpd.GeoDataFrame, target_crs: str) -> gpd.GeoDataFrame:
    """
    Reproject geospatial data to a different coordinate reference system.
    
    Args:
        gdf: Input GeoDataFrame
        target_crs: Target coordinate reference system (e.g., 'EPSG:4326')
    
    Returns:
        Reprojected GeoDataFrame
    """
    try:
        return gdf.to_crs(target_crs)
    except Exception as e:
        logger.error(f"Failed to reproject data to {target_crs}: {str(e)}")
        raise

def calculate_buffer(
    gdf: gpd.GeoDataFrame,
    distance: float,
    resolution: int = 16
) -> gpd.GeoDataFrame:
    """
    Calculate buffer zones around geometries.
    
    Args:
        gdf: Input GeoDataFrame
        distance: Buffer distance in units of the CRS
        resolution: Number of points in the buffer circle
    
    Returns:
        GeoDataFrame with buffered geometries
    """
    try:
        buffered = gdf.copy()
        buffered.geometry = buffered.geometry.buffer(distance, resolution=resolution)
        return buffered
    except Exception as e:
        logger.error(f"Failed to calculate buffer: {str(e)}")
        raise

def perform_spatial_join(
    left_gdf: gpd.GeoDataFrame,
    right_gdf: gpd.GeoDataFrame,
    how: str = 'inner',
    predicate: str = 'intersects'
) -> gpd.GeoDataFrame:
    """
    Perform spatial join between two GeoDataFrames.
    
    Args:
        left_gdf: Left GeoDataFrame
        right_gdf: Right GeoDataFrame
        how: Type of join ('left', 'right', 'inner', 'outer')
        predicate: Spatial predicate ('intersects', 'contains', 'within', etc.)
    
    Returns:
        Joined GeoDataFrame
    """
    try:
        return gpd.sjoin(left_gdf, right_gdf, how=how, predicate=predicate)
    except Exception as e:
        logger.error(f"Failed to perform spatial join: {str(e)}")
        raise

def calculate_centroids(gdf: gpd.GeoDataFrame) -> gpd.GeoDataFrame:
    """
    Calculate centroids of geometries.
    
    Args:
        gdf: Input GeoDataFrame
    
    Returns:
        GeoDataFrame with centroid points
    """
    try:
        centroids = gdf.copy()
        centroids.geometry = centroids.geometry.centroid
        return centroids
    except Exception as e:
        logger.error(f"Failed to calculate centroids: {str(e)}")
        raise

def perform_clustering(
    gdf: gpd.GeoDataFrame,
    algorithm: str = 'kmeans',
    n_clusters: int = 5,
    **kwargs
) -> Dict[str, Union[np.ndarray, List[float]]]:
    """
    Perform clustering on geospatial data.
    
    Args:
        gdf: Input GeoDataFrame
        algorithm: Clustering algorithm ('kmeans' or 'dbscan')
        n_clusters: Number of clusters (for k-means)
        **kwargs: Additional arguments for the clustering algorithm
    
    Returns:
        Dictionary containing cluster labels and centroids
    """
    try:
        # Extract coordinates
        coords = np.array([[p.x, p.y] for p in gdf.geometry])
        
        # Scale coordinates
        scaler = StandardScaler()
        coords_scaled = scaler.fit_transform(coords)
        
        if algorithm.lower() == 'kmeans':
            model = KMeans(n_clusters=n_clusters, **kwargs)
        elif algorithm.lower() == 'dbscan':
            model = DBSCAN(**kwargs)
        else:
            raise ValueError(f"Unsupported clustering algorithm: {algorithm}")
        
        # Perform clustering
        labels = model.fit_predict(coords_scaled)
        
        # Calculate cluster centroids
        centroids = []
        for i in range(max(labels) + 1):
            cluster_points = coords[labels == i]
            centroid = np.mean(cluster_points, axis=0)
            centroids.append(centroid.tolist())
        
        return {
            'labels': labels,
            'centroids': centroids
        }
    except Exception as e:
        logger.error(f"Failed to perform clustering: {str(e)}")
        raise

def calculate_spatial_statistics(
    gdf: gpd.GeoDataFrame,
    column: Optional[str] = None
) -> Dict[str, float]:
    """
    Calculate spatial statistics for geometries.
    
    Args:
        gdf: Input GeoDataFrame
        column: Column name for attribute-based statistics
    
    Returns:
        Dictionary containing spatial statistics
    """
    try:
        stats = {
            'count': len(gdf),
            'total_area': gdf.geometry.area.sum(),
            'total_length': gdf.geometry.length.sum()
        }
        
        if column:
            stats.update({
                'mean': gdf[column].mean(),
                'median': gdf[column].median(),
                'std': gdf[column].std(),
                'min': gdf[column].min(),
                'max': gdf[column].max()
            })
        
        return stats
    except Exception as e:
        logger.error(f"Failed to calculate spatial statistics: {str(e)}")
        raise

def validate_geometries(gdf: gpd.GeoDataFrame) -> Dict[str, List[int]]:
    """
    Validate geometries in a GeoDataFrame.
    
    Args:
        gdf: Input GeoDataFrame
    
    Returns:
        Dictionary containing indices of invalid geometries by type
    """
    try:
        invalid = {
            'empty': [],
            'null': [],
            'invalid': []
        }
        
        for idx, geom in enumerate(gdf.geometry):
            if geom.is_empty:
                invalid['empty'].append(idx)
            elif geom.is_null:
                invalid['null'].append(idx)
            elif not geom.is_valid:
                invalid['invalid'].append(idx)
        
        return invalid
    except Exception as e:
        logger.error(f"Failed to validate geometries: {str(e)}")
        raise

def simplify_geometries(
    gdf: gpd.GeoDataFrame,
    tolerance: float,
    preserve_topology: bool = True
) -> gpd.GeoDataFrame:
    """
    Simplify geometries using Douglas-Peucker algorithm.
    
    Args:
        gdf: Input GeoDataFrame
        tolerance: Tolerance for simplification
        preserve_topology: Whether to preserve topology
    
    Returns:
        GeoDataFrame with simplified geometries
    """
    try:
        simplified = gdf.copy()
        simplified.geometry = simplified.geometry.simplify(
            tolerance,
            preserve_topology=preserve_topology
        )
        return simplified
    except Exception as e:
        logger.error(f"Failed to simplify geometries: {str(e)}")
        raise 