/*
 * This file is part of the nivo project.
 *
 * Copyright 2016-present, Raphaël Benitte.
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
 */
import { useMemo } from 'react'
import { isFunction, get } from 'lodash'
import {
    geoPath,
    geoAzimuthalEqualArea,
    geoAzimuthalEquidistant,
    geoGnomonic,
    geoOrthographic,
    geoStereographic,
    geoEqualEarth,
    geoEquirectangular,
    geoMercator,
    geoTransverseMercator,
    geoNaturalEarth1,
    geoGraticule,
} from 'd3-geo'
import { guessQuantizeColorScale } from '@nivo/core'
export const projectionById = {
    azimuthalEqualArea: geoAzimuthalEqualArea,
    azimuthalEquidistant: geoAzimuthalEquidistant,
    gnomonic: geoGnomonic,
    orthographic: geoOrthographic,
    stereographic: geoStereographic,
    equalEarth: geoEqualEarth,
    equirectangular: geoEquirectangular,
    mercator: geoMercator,
    transverseMercator: geoTransverseMercator,
    naturalEarth1: geoNaturalEarth1,
}

export const useGeoMap = ({
    width,
    height,
    projectionType,
    projectionScale,
    projectionTranslation,
    projectionRotation,
    fillColor,
    borderWidth,
    borderColor,
}) => {
    const projection = useMemo(() => {
        return projectionById[projectionType]()
            .scale(projectionScale)
            .translate([width * projectionTranslation[0], height * projectionTranslation[1]])
            .rotate(projectionRotation)
    }, [
        width,
        height,
        projectionType,
        projectionScale,
        projectionTranslation[0],
        projectionTranslation[1],
        projectionRotation[0],
        projectionRotation[1],
        projectionRotation[2],
    ])
    const path = useMemo(() => geoPath(projection), [projection])
    const graticule = useMemo(() => geoGraticule())

    const getBorderWidth = useMemo(
        () => (typeof borderWidth === 'function' ? borderWidth : () => borderWidth),
        [borderWidth]
    )
    const getBorderColor = useMemo(
        () => (typeof borderColor === 'function' ? borderColor : () => borderColor),
        [borderColor]
    )
    const getFillColor = useMemo(
        () => (typeof fillColor === 'function' ? fillColor : () => fillColor),
        [fillColor]
    )

    return {
        projection,
        path,
        graticule,
        getBorderWidth,
        getBorderColor,
        getFillColor,
    }
}

export const useChoropleth = ({ features, data, match, value, colors, unknownColor }) => {
    const findMatchingDatum = useMemo(() => {
        if (isFunction(match)) return match
        return (feature, datum) => {
            const featureKey = get(feature, match)
            const datumKey = get(datum, match)

            return featureKey && featureKey === datumKey
        }
    }, [match])
    const getValue = useMemo(() => (isFunction(value) ? value : datum => get(datum, value)), [
        value,
    ])
    const getFillColor = useMemo(() => {
        const colorScale = guessQuantizeColorScale(colors).domain([0, 1000000])

        return feature => {
            if (feature.value === undefined) return unknownColor
            return colorScale(feature.value)
        }
    }, [colors, unknownColor])
    const boundFeatures = useMemo(
        () =>
            features.map(feature => {
                const datum = data.find(datum => findMatchingDatum(feature, datum))
                const datumValue = getValue(datum)

                if (datum) {
                    const featureWithData = {
                        ...feature,
                        data: datum,
                        value: datumValue,
                    }
                    featureWithData.color = getFillColor(featureWithData)

                    return featureWithData
                }

                return feature
            }),
        [features, data, findMatchingDatum, getValue, getFillColor]
    )

    return {
        getFillColor,
        boundFeatures,
    }
}