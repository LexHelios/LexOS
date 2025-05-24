import logging
from typing import Dict, List, Optional, Tuple, Union

import geopandas as gpd
import numpy as np
from scipy import stats
from shapely.geometry import Point, Polygon
from sklearn.cluster import DBSCAN, KMeans
from sklearn.preprocessing import StandardScaler

logger = logging.getLogger(__name__)

def calculate_density(
    gdf: gpd.GeoDataFrame,
    value_column: Optional[str] = None,
    area_column: Optional[str] = None,
    weight_column: Optional[str] = None
) -> gpd.GeoDataFrame:
    """
    Calculate density values for geometries.
    
    Args:
        gdf: Input GeoDataFrame
        value_column: Column containing values to calculate density for
        area_column: Column containing area values (if None, uses geometry area)
        weight_column: Column containing weights for weighted density
    
    Returns:
        GeoDataFrame with added density column
    """
    try:
        result = gdf.copy()
        
        # Calculate areas if not provided
        if area_column is None:
            areas = result.geometry.area
        else:
            areas = result[area_column]
        
        # Calculate density
        if value_column:
            if weight_column:
                result['density'] = (result[value_column] * result[weight_column]) / areas
            else:
                result['density'] = result[value_column] / areas
        else:
            if weight_column:
                result['density'] = result[weight_column] / areas
            else:
                result['density'] = 1 / areas
        
        return result
    except Exception as e:
        logger.error(f"Failed to calculate density: {str(e)}")
        raise

def perform_spatial_clustering(
    gdf: gpd.GeoDataFrame,
    algorithm: str = 'kmeans',
    n_clusters: int = 5,
    distance_metric: str = 'euclidean',
    **kwargs
) -> Dict[str, Union[np.ndarray, List[float]]]:
    """
    Perform spatial clustering on geometries.
    
    Args:
        gdf: Input GeoDataFrame
        algorithm: Clustering algorithm ('kmeans' or 'dbscan')
        n_clusters: Number of clusters (for k-means)
        distance_metric: Distance metric to use
        **kwargs: Additional arguments for the clustering algorithm
    
    Returns:
        Dictionary containing cluster labels and centroids
    """
    try:
        # Extract coordinates
        coords = np.array([[p.x, p.y] for p in gdf.geometry.centroid])
        
        # Scale coordinates
        scaler = StandardScaler()
        coords_scaled = scaler.fit_transform(coords)
        
        # Perform clustering
        if algorithm.lower() == 'kmeans':
            model = KMeans(n_clusters=n_clusters, **kwargs)
        elif algorithm.lower() == 'dbscan':
            model = DBSCAN(metric=distance_metric, **kwargs)
        else:
            raise ValueError(f"Unsupported clustering algorithm: {algorithm}")
        
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
        logger.error(f"Failed to perform spatial clustering: {str(e)}")
        raise

def calculate_spatial_autocorrelation(
    gdf: gpd.GeoDataFrame,
    column: str,
    method: str = 'moran',
    **kwargs
) -> Dict[str, float]:
    """
    Calculate spatial autocorrelation statistics.
    
    Args:
        gdf: Input GeoDataFrame
        column: Column to analyze
        method: Autocorrelation method ('moran' or 'geary')
        **kwargs: Additional arguments for the autocorrelation calculation
    
    Returns:
        Dictionary containing autocorrelation statistics
    """
    try:
        from libpysal.weights import Queen
        from esda.moran import Moran
        from esda.geary import Geary
        
        # Create spatial weights
        w = Queen.from_dataframe(gdf)
        
        # Calculate autocorrelation
        if method.lower() == 'moran':
            moran = Moran(gdf[column], w, **kwargs)
            return {
                'moran_i': moran.I,
                'p_value': moran.p_sim,
                'z_score': moran.z_sim
            }
        elif method.lower() == 'geary':
            geary = Geary(gdf[column], w, **kwargs)
            return {
                'geary_c': geary.C,
                'p_value': geary.p_sim,
                'z_score': geary.z_sim
            }
        else:
            raise ValueError(f"Unsupported autocorrelation method: {method}")
    except Exception as e:
        logger.error(f"Failed to calculate spatial autocorrelation: {str(e)}")
        raise

def perform_hot_spot_analysis(
    gdf: gpd.GeoDataFrame,
    column: str,
    **kwargs
) -> Dict[str, Union[np.ndarray, List[float]]]:
    """
    Perform hot spot analysis using Getis-Ord Gi* statistic.
    
    Args:
        gdf: Input GeoDataFrame
        column: Column to analyze
        **kwargs: Additional arguments for the hot spot analysis
    
    Returns:
        Dictionary containing hot spot statistics
    """
    try:
        from libpysal.weights import Queen
        from esda.getisord import G_Local
        
        # Create spatial weights
        w = Queen.from_dataframe(gdf)
        
        # Calculate Getis-Ord Gi* statistic
        g_local = G_Local(gdf[column], w, transform='R', **kwargs)
        
        return {
            'z_scores': g_local.z_sim,
            'p_values': g_local.p_sim,
            'hot_spots': np.where(g_local.z_sim > 1.96)[0],
            'cold_spots': np.where(g_local.z_sim < -1.96)[0]
        }
    except Exception as e:
        logger.error(f"Failed to perform hot spot analysis: {str(e)}")
        raise

def calculate_spatial_relationships(
    gdf1: gpd.GeoDataFrame,
    gdf2: gpd.GeoDataFrame,
    relationship_type: str = 'intersects'
) -> Dict[str, List[int]]:
    """
    Calculate spatial relationships between two GeoDataFrames.
    
    Args:
        gdf1: First GeoDataFrame
        gdf2: Second GeoDataFrame
        relationship_type: Type of spatial relationship to check
    
    Returns:
        Dictionary containing indices of related features
    """
    try:
        relationships = {
            'gdf1_indices': [],
            'gdf2_indices': []
        }
        
        for i, geom1 in enumerate(gdf1.geometry):
            for j, geom2 in enumerate(gdf2.geometry):
                if getattr(geom1, relationship_type)(geom2):
                    relationships['gdf1_indices'].append(i)
                    relationships['gdf2_indices'].append(j)
        
        return relationships
    except Exception as e:
        logger.error(f"Failed to calculate spatial relationships: {str(e)}")
        raise

def perform_spatial_interpolation(
    gdf: gpd.GeoDataFrame,
    value_column: str,
    method: str = 'idw',
    resolution: float = 0.01,
    **kwargs
) -> gpd.GeoDataFrame:
    """
    Perform spatial interpolation of point data.
    
    Args:
        gdf: Input GeoDataFrame with point geometries
        value_column: Column containing values to interpolate
        method: Interpolation method ('idw' or 'kriging')
        resolution: Resolution of the output grid
        **kwargs: Additional arguments for the interpolation method
    
    Returns:
        GeoDataFrame with interpolated values
    """
    try:
        from scipy.interpolate import griddata
        
        # Extract coordinates and values
        points = np.array([[p.x, p.y] for p in gdf.geometry])
        values = gdf[value_column].values
        
        # Create grid
        x_min, y_min, x_max, y_max = gdf.total_bounds
        x = np.arange(x_min, x_max, resolution)
        y = np.arange(y_min, y_max, resolution)
        xi, yi = np.meshgrid(x, y)
        
        # Perform interpolation
        if method.lower() == 'idw':
            from scipy.spatial import cKDTree
            tree = cKDTree(points)
            distances, indices = tree.query(np.column_stack([xi.ravel(), yi.ravel()]))
            weights = 1.0 / (distances + 1e-10)
            zi = np.sum(weights[:, np.newaxis] * values[indices], axis=1) / np.sum(weights, axis=1)
        else:
            zi = griddata(points, values, (xi, yi), method=method, **kwargs)
        
        # Create output GeoDataFrame
        rows = []
        for i in range(len(x)):
            for j in range(len(y)):
                if not np.isnan(zi[i, j]):
                    point = Point(xi[i, j], yi[i, j])
                    rows.append({
                        'geometry': point,
                        'value': zi[i, j]
                    })
        
        return gpd.GeoDataFrame(rows, crs=gdf.crs)
    except Exception as e:
        logger.error(f"Failed to perform spatial interpolation: {str(e)}")
        raise

def calculate_spatial_statistics(
    gdf: gpd.GeoDataFrame,
    column: Optional[str] = None,
    group_by: Optional[str] = None
) -> Dict[str, Union[float, Dict[str, float]]]:
    """
    Calculate spatial statistics for geometries.
    
    Args:
        gdf: Input GeoDataFrame
        column: Column to calculate statistics for
        group_by: Column to group statistics by
    
    Returns:
        Dictionary containing spatial statistics
    """
    try:
        stats_dict = {}
        
        if group_by:
            for group in gdf[group_by].unique():
                group_gdf = gdf[gdf[group_by] == group]
                stats_dict[group] = {
                    'count': len(group_gdf),
                    'area': group_gdf.geometry.area.sum(),
                    'perimeter': group_gdf.geometry.length.sum()
                }
                if column:
                    stats_dict[group].update({
                        'mean': group_gdf[column].mean(),
                        'median': group_gdf[column].median(),
                        'std': group_gdf[column].std(),
                        'min': group_gdf[column].min(),
                        'max': group_gdf[column].max()
                    })
        else:
            stats_dict = {
                'count': len(gdf),
                'area': gdf.geometry.area.sum(),
                'perimeter': gdf.geometry.length.sum()
            }
            if column:
                stats_dict.update({
                    'mean': gdf[column].mean(),
                    'median': gdf[column].median(),
                    'std': gdf[column].std(),
                    'min': gdf[column].min(),
                    'max': gdf[column].max()
                })
        
        return stats_dict
    except Exception as e:
        logger.error(f"Failed to calculate spatial statistics: {str(e)}")
        raise 