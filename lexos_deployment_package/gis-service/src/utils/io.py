import json
import logging
import os
from typing import Dict, List, Optional, Union

import geopandas as gpd
import numpy as np
import pandas as pd
from shapely.geometry import Point, Polygon, LineString, mapping

logger = logging.getLogger(__name__)

def read_geospatial_file(
    file_path: str,
    layer: Optional[str] = None,
    **kwargs
) -> gpd.GeoDataFrame:
    """
    Read geospatial data from various file formats.
    
    Args:
        file_path: Path to the geospatial data file
        layer: Layer name (for multi-layer formats)
        **kwargs: Additional arguments for geopandas.read_file()
    
    Returns:
        GeoDataFrame containing the loaded data
    """
    try:
        return gpd.read_file(file_path, layer=layer, **kwargs)
    except Exception as e:
        logger.error(f"Failed to read geospatial file {file_path}: {str(e)}")
        raise

def write_geospatial_file(
    gdf: gpd.GeoDataFrame,
    file_path: str,
    driver: Optional[str] = None,
    **kwargs
) -> None:
    """
    Write geospatial data to various file formats.
    
    Args:
        gdf: GeoDataFrame to write
        file_path: Path to save the file
        driver: OGR driver name (if None, inferred from file extension)
        **kwargs: Additional arguments for GeoDataFrame.to_file()
    """
    try:
        gdf.to_file(file_path, driver=driver, **kwargs)
    except Exception as e:
        logger.error(f"Failed to write geospatial file {file_path}: {str(e)}")
        raise

def export_to_geojson(
    gdf: gpd.GeoDataFrame,
    file_path: str,
    pretty: bool = True,
    **kwargs
) -> None:
    """
    Export GeoDataFrame to GeoJSON format.
    
    Args:
        gdf: GeoDataFrame to export
        file_path: Path to save the GeoJSON file
        pretty: Whether to format the JSON with indentation
        **kwargs: Additional arguments for GeoDataFrame.to_file()
    """
    try:
        gdf.to_file(
            file_path,
            driver='GeoJSON',
            indent=4 if pretty else None,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to export to GeoJSON {file_path}: {str(e)}")
        raise

def export_to_shapefile(
    gdf: gpd.GeoDataFrame,
    file_path: str,
    **kwargs
) -> None:
    """
    Export GeoDataFrame to Shapefile format.
    
    Args:
        gdf: GeoDataFrame to export
        file_path: Path to save the Shapefile
        **kwargs: Additional arguments for GeoDataFrame.to_file()
    """
    try:
        gdf.to_file(file_path, driver='ESRI Shapefile', **kwargs)
    except Exception as e:
        logger.error(f"Failed to export to Shapefile {file_path}: {str(e)}")
        raise

def export_to_csv(
    gdf: gpd.GeoDataFrame,
    file_path: str,
    include_geometry: bool = True,
    **kwargs
) -> None:
    """
    Export GeoDataFrame to CSV format.
    
    Args:
        gdf: GeoDataFrame to export
        file_path: Path to save the CSV file
        include_geometry: Whether to include geometry column
        **kwargs: Additional arguments for pandas.to_csv()
    """
    try:
        if include_geometry:
            # Convert geometry to WKT
            gdf['geometry'] = gdf.geometry.apply(lambda x: x.wkt)
        
        gdf.to_csv(file_path, index=False, **kwargs)
    except Exception as e:
        logger.error(f"Failed to export to CSV {file_path}: {str(e)}")
        raise

def import_from_csv(
    file_path: str,
    geometry_column: str = 'geometry',
    crs: Optional[str] = None,
    **kwargs
) -> gpd.GeoDataFrame:
    """
    Import geospatial data from CSV format.
    
    Args:
        file_path: Path to the CSV file
        geometry_column: Name of the column containing geometry
        crs: Coordinate reference system
        **kwargs: Additional arguments for pandas.read_csv()
    
    Returns:
        GeoDataFrame containing the imported data
    """
    try:
        # Read CSV file
        df = pd.read_csv(file_path, **kwargs)
        
        # Convert geometry column to shapely objects
        from shapely import wkt
        df[geometry_column] = df[geometry_column].apply(wkt.loads)
        
        # Create GeoDataFrame
        return gpd.GeoDataFrame(df, geometry=geometry_column, crs=crs)
    except Exception as e:
        logger.error(f"Failed to import from CSV {file_path}: {str(e)}")
        raise

def export_to_postgis(
    gdf: gpd.GeoDataFrame,
    table_name: str,
    connection_string: str,
    if_exists: str = 'fail',
    **kwargs
) -> None:
    """
    Export GeoDataFrame to PostGIS database.
    
    Args:
        gdf: GeoDataFrame to export
        table_name: Name of the table to create
        connection_string: SQLAlchemy connection string
        if_exists: How to behave if the table already exists
        **kwargs: Additional arguments for GeoDataFrame.to_postgis()
    """
    try:
        gdf.to_postgis(
            table_name,
            connection_string,
            if_exists=if_exists,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to export to PostGIS table {table_name}: {str(e)}")
        raise

def import_from_postgis(
    table_name: str,
    connection_string: str,
    **kwargs
) -> gpd.GeoDataFrame:
    """
    Import geospatial data from PostGIS database.
    
    Args:
        table_name: Name of the table to read
        connection_string: SQLAlchemy connection string
        **kwargs: Additional arguments for geopandas.read_postgis()
    
    Returns:
        GeoDataFrame containing the imported data
    """
    try:
        return gpd.read_postgis(
            f"SELECT * FROM {table_name}",
            connection_string,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to import from PostGIS table {table_name}: {str(e)}")
        raise

def export_to_geopackage(
    gdf: gpd.GeoDataFrame,
    file_path: str,
    layer_name: str,
    **kwargs
) -> None:
    """
    Export GeoDataFrame to GeoPackage format.
    
    Args:
        gdf: GeoDataFrame to export
        file_path: Path to save the GeoPackage
        layer_name: Name of the layer
        **kwargs: Additional arguments for GeoDataFrame.to_file()
    """
    try:
        gdf.to_file(
            file_path,
            driver='GPKG',
            layer=layer_name,
            **kwargs
        )
    except Exception as e:
        logger.error(f"Failed to export to GeoPackage {file_path}: {str(e)}")
        raise

def import_from_geopackage(
    file_path: str,
    layer_name: str,
    **kwargs
) -> gpd.GeoDataFrame:
    """
    Import geospatial data from GeoPackage format.
    
    Args:
        file_path: Path to the GeoPackage file
        layer_name: Name of the layer to read
        **kwargs: Additional arguments for geopandas.read_file()
    
    Returns:
        GeoDataFrame containing the imported data
    """
    try:
        return gpd.read_file(file_path, layer=layer_name, **kwargs)
    except Exception as e:
        logger.error(f"Failed to import from GeoPackage {file_path}: {str(e)}")
        raise

def export_to_kml(
    gdf: gpd.GeoDataFrame,
    file_path: str,
    **kwargs
) -> None:
    """
    Export GeoDataFrame to KML format.
    
    Args:
        gdf: GeoDataFrame to export
        file_path: Path to save the KML file
        **kwargs: Additional arguments for GeoDataFrame.to_file()
    """
    try:
        gdf.to_file(file_path, driver='KML', **kwargs)
    except Exception as e:
        logger.error(f"Failed to export to KML {file_path}: {str(e)}")
        raise

def import_from_kml(
    file_path: str,
    **kwargs
) -> gpd.GeoDataFrame:
    """
    Import geospatial data from KML format.
    
    Args:
        file_path: Path to the KML file
        **kwargs: Additional arguments for geopandas.read_file()
    
    Returns:
        GeoDataFrame containing the imported data
    """
    try:
        return gpd.read_file(file_path, driver='KML', **kwargs)
    except Exception as e:
        logger.error(f"Failed to import from KML {file_path}: {str(e)}")
        raise 