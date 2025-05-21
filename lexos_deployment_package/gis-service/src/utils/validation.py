import logging
from typing import Dict, List, Optional, Set, Tuple, Union

import geopandas as gpd
import numpy as np
from shapely.geometry import Point, Polygon, LineString
from shapely.validation import make_valid

logger = logging.getLogger(__name__)

def validate_coordinates(
    gdf: gpd.GeoDataFrame,
    min_lat: float = -90,
    max_lat: float = 90,
    min_lon: float = -180,
    max_lon: float = 180
) -> Dict[str, List[int]]:
    """
    Validate coordinate ranges in a GeoDataFrame.
    
    Args:
        gdf: Input GeoDataFrame
        min_lat: Minimum latitude
        max_lat: Maximum latitude
        min_lon: Minimum longitude
        max_lon: Maximum longitude
    
    Returns:
        Dictionary containing indices of invalid coordinates
    """
    try:
        invalid = {
            'latitude': [],
            'longitude': []
        }
        
        for idx, geom in enumerate(gdf.geometry):
            if isinstance(geom, Point):
                if not (min_lat <= geom.y <= max_lat):
                    invalid['latitude'].append(idx)
                if not (min_lon <= geom.x <= max_lon):
                    invalid['longitude'].append(idx)
            else:
                bounds = geom.bounds
                if not (min_lat <= bounds[1] <= max_lat and min_lat <= bounds[3] <= max_lat):
                    invalid['latitude'].append(idx)
                if not (min_lon <= bounds[0] <= max_lon and min_lon <= bounds[2] <= max_lon):
                    invalid['longitude'].append(idx)
        
        return invalid
    except Exception as e:
        logger.error(f"Failed to validate coordinates: {str(e)}")
        raise

def check_topology(
    gdf: gpd.GeoDataFrame,
    check_self_intersection: bool = True,
    check_overlap: bool = True,
    check_gaps: bool = True
) -> Dict[str, List[int]]:
    """
    Check topological relationships in a GeoDataFrame.
    
    Args:
        gdf: Input GeoDataFrame
        check_self_intersection: Whether to check for self-intersections
        check_overlap: Whether to check for overlaps
        check_gaps: Whether to check for gaps
    
    Returns:
        Dictionary containing indices of features with topological issues
    """
    try:
        issues = {
            'self_intersection': [],
            'overlap': [],
            'gaps': []
        }
        
        # Check self-intersections
        if check_self_intersection:
            for idx, geom in enumerate(gdf.geometry):
                if not geom.is_valid:
                    issues['self_intersection'].append(idx)
        
        # Check overlaps
        if check_overlap:
            for i in range(len(gdf)):
                for j in range(i + 1, len(gdf)):
                    if gdf.iloc[i].geometry.overlaps(gdf.iloc[j].geometry):
                        issues['overlap'].extend([i, j])
        
        # Check gaps
        if check_gaps:
            # Create a union of all geometries
            union = gdf.geometry.unary_union
            # Check if there are any gaps in the union
            if not union.is_valid:
                issues['gaps'].append(-1)  # -1 indicates a gap in the overall coverage
        
        return issues
    except Exception as e:
        logger.error(f"Failed to check topology: {str(e)}")
        raise

def validate_attribute_data(
    gdf: gpd.GeoDataFrame,
    required_columns: Optional[List[str]] = None,
    numeric_columns: Optional[List[str]] = None,
    categorical_columns: Optional[List[str]] = None,
    date_columns: Optional[List[str]] = None
) -> Dict[str, List[int]]:
    """
    Validate attribute data in a GeoDataFrame.
    
    Args:
        gdf: Input GeoDataFrame
        required_columns: List of required column names
        numeric_columns: List of numeric column names
        categorical_columns: List of categorical column names
        date_columns: List of date column names
    
    Returns:
        Dictionary containing indices of features with invalid attributes
    """
    try:
        invalid = {
            'missing_required': [],
            'invalid_numeric': [],
            'invalid_categorical': [],
            'invalid_date': []
        }
        
        # Check required columns
        if required_columns:
            for col in required_columns:
                if col not in gdf.columns:
                    raise ValueError(f"Required column {col} not found in GeoDataFrame")
                missing = gdf[gdf[col].isna()].index.tolist()
                invalid['missing_required'].extend(missing)
        
        # Check numeric columns
        if numeric_columns:
            for col in numeric_columns:
                if col not in gdf.columns:
                    raise ValueError(f"Numeric column {col} not found in GeoDataFrame")
                non_numeric = gdf[~gdf[col].apply(lambda x: isinstance(x, (int, float)) or np.isnan(x))].index.tolist()
                invalid['invalid_numeric'].extend(non_numeric)
        
        # Check categorical columns
        if categorical_columns:
            for col in categorical_columns:
                if col not in gdf.columns:
                    raise ValueError(f"Categorical column {col} not found in GeoDataFrame")
                # Add any specific categorical validation logic here
        
        # Check date columns
        if date_columns:
            for col in date_columns:
                if col not in gdf.columns:
                    raise ValueError(f"Date column {col} not found in GeoDataFrame")
                # Add any specific date validation logic here
        
        return invalid
    except Exception as e:
        logger.error(f"Failed to validate attribute data: {str(e)}")
        raise

def fix_geometry_issues(
    gdf: gpd.GeoDataFrame,
    fix_invalid: bool = True,
    fix_self_intersection: bool = True,
    fix_overlap: bool = True
) -> gpd.GeoDataFrame:
    """
    Fix common geometry issues in a GeoDataFrame.
    
    Args:
        gdf: Input GeoDataFrame
        fix_invalid: Whether to fix invalid geometries
        fix_self_intersection: Whether to fix self-intersections
        fix_overlap: Whether to fix overlaps
    
    Returns:
        GeoDataFrame with fixed geometries
    """
    try:
        fixed = gdf.copy()
        
        # Fix invalid geometries
        if fix_invalid:
            fixed.geometry = fixed.geometry.apply(lambda x: make_valid(x) if not x.is_valid else x)
        
        # Fix self-intersections
        if fix_self_intersection:
            fixed.geometry = fixed.geometry.apply(lambda x: x.buffer(0) if not x.is_valid else x)
        
        # Fix overlaps
        if fix_overlap:
            # This is a simplified approach - in practice, you might want to
            # implement more sophisticated overlap resolution strategies
            fixed.geometry = fixed.geometry.apply(lambda x: x.buffer(-0.0001).buffer(0.0001))
        
        return fixed
    except Exception as e:
        logger.error(f"Failed to fix geometry issues: {str(e)}")
        raise

def check_data_quality(
    gdf: gpd.GeoDataFrame,
    min_area: Optional[float] = None,
    max_area: Optional[float] = None,
    min_length: Optional[float] = None,
    max_length: Optional[float] = None,
    min_points: Optional[int] = None,
    max_points: Optional[int] = None
) -> Dict[str, List[int]]:
    """
    Check data quality metrics for geometries.
    
    Args:
        gdf: Input GeoDataFrame
        min_area: Minimum area threshold
        max_area: Maximum area threshold
        min_length: Minimum length threshold
        max_length: Maximum length threshold
        min_points: Minimum number of points
        max_points: Maximum number of points
    
    Returns:
        Dictionary containing indices of features that fail quality checks
    """
    try:
        quality_issues = {
            'area': [],
            'length': [],
            'points': []
        }
        
        for idx, geom in enumerate(gdf.geometry):
            # Check area
            if min_area is not None or max_area is not None:
                area = geom.area
                if min_area is not None and area < min_area:
                    quality_issues['area'].append(idx)
                if max_area is not None and area > max_area:
                    quality_issues['area'].append(idx)
            
            # Check length
            if min_length is not None or max_length is not None:
                length = geom.length
                if min_length is not None and length < min_length:
                    quality_issues['length'].append(idx)
                if max_length is not None and length > max_length:
                    quality_issues['length'].append(idx)
            
            # Check number of points
            if min_points is not None or max_points is not None:
                if isinstance(geom, (Polygon, LineString)):
                    points = len(geom.coords)
                    if min_points is not None and points < min_points:
                        quality_issues['points'].append(idx)
                    if max_points is not None and points > max_points:
                        quality_issues['points'].append(idx)
        
        return quality_issues
    except Exception as e:
        logger.error(f"Failed to check data quality: {str(e)}")
        raise

def generate_quality_report(
    gdf: gpd.GeoDataFrame,
    output_path: Optional[str] = None
) -> Dict[str, Union[int, float, List[int]]]:
    """
    Generate a comprehensive quality report for a GeoDataFrame.
    
    Args:
        gdf: Input GeoDataFrame
        output_path: Optional path to save the report
    
    Returns:
        Dictionary containing quality metrics and issues
    """
    try:
        report = {
            'total_features': len(gdf),
            'geometry_types': gdf.geometry.type.value_counts().to_dict(),
            'coordinate_system': str(gdf.crs),
            'invalid_geometries': len(gdf[~gdf.geometry.is_valid]),
            'empty_geometries': len(gdf[gdf.geometry.is_empty]),
            'null_geometries': len(gdf[gdf.geometry.isna()]),
            'attribute_completeness': {
                col: (1 - gdf[col].isna().mean()) * 100
                for col in gdf.columns
                if col != 'geometry'
            },
            'topology_issues': check_topology(gdf),
            'coordinate_issues': validate_coordinates(gdf),
            'quality_issues': check_data_quality(gdf)
        }
        
        if output_path:
            import json
            with open(output_path, 'w') as f:
                json.dump(report, f, indent=2)
        
        return report
    except Exception as e:
        logger.error(f"Failed to generate quality report: {str(e)}")
        raise 