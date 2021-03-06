import * as _ from 'lodash'
import { Box, Flex, RadioGroup, Text, Checkbox } from '@fluentui/react'
import { PerfChart, usePerfData } from '../PerfChart'
import * as React from 'react'
import { PerfData, PerfSample } from '../PerfChart/PerfDataContext'

enum FILTER_BY {
  CI_BUILD = 'ci build',
  RELEASE = 'release',
  DAY = 'day',
  MONTH = 'month',
}

export const ComponentPerfChart = ({ perfTestName }) => {
  const { loading, error, data } = usePerfData(perfTestName)

  const [filterBy, setFilterBy] = React.useState(FILTER_BY.CI_BUILD)
  const [withExtremes, setWithExtremes] = React.useState(false)

  let filteredData: PerfData = data

  switch (filterBy) {
    case FILTER_BY.CI_BUILD:
      filteredData = data
      break

    case FILTER_BY.RELEASE:
      filteredData = data.filter(entry => entry.tag)

      if (!data[0].tag) {
        const unreleased = { ...data[0], tag: 'UNRELEASED' }
        filteredData.unshift(unreleased)
      }
      break

    case FILTER_BY.DAY:
      filteredData = []
      _.forEachRight(data, (sample: PerfSample, i, arr) => {
        const prevSample = arr[i - 1]

        if (!prevSample) {
          filteredData.push(sample)
          return
        }

        const lastDate = new Date(prevSample.ts)
        const nextDate = new Date(sample.ts)

        if (
          lastDate.getDate() !== nextDate.getDate() ||
          lastDate.getMonth() !== nextDate.getMonth() ||
          lastDate.getFullYear() !== nextDate.getFullYear()
        ) {
          filteredData.push(sample)
        }
      })
      break

    case FILTER_BY.MONTH:
      filteredData = []

      _.forEachRight(data, (sample: PerfSample, i, arr) => {
        const prevSample = arr[i - 1]

        if (!prevSample) {
          filteredData.push(sample)
          return
        }

        const lastDate = new Date(prevSample.ts)
        const nextDate = new Date(sample.ts)

        if (
          lastDate.getMonth() !== nextDate.getMonth() ||
          lastDate.getFullYear() !== nextDate.getFullYear()
        ) {
          filteredData.push(sample)
        }
      })
      break

    default:
      break
  }

  const handleFilterChange = React.useCallback((e, props) => {
    setFilterBy(props.value)
  }, [])

  return (
    <div>
      <Flex vAlign="center" gap="gap.large">
        {process.env.NODE_ENV !== 'production' && (
          <RadioGroup
            defaultCheckedValue={FILTER_BY.CI_BUILD}
            checkedValueChanged={handleFilterChange}
            items={[
              { key: 'ci-build', label: FILTER_BY.CI_BUILD, value: FILTER_BY.CI_BUILD },
              { key: 'release', label: FILTER_BY.RELEASE, value: FILTER_BY.RELEASE },
              { key: 'day', label: FILTER_BY.DAY, value: FILTER_BY.DAY },
              { key: 'month', label: FILTER_BY.MONTH, value: FILTER_BY.MONTH },
            ]}
          />
        )}
        <Checkbox
          label="Show extremes"
          defaultChecked={withExtremes}
          onChange={(e, { checked }) => setWithExtremes(checked)}
        />
      </Flex>

      <Box
        styles={{
          '::before': {
            paddingTop: '50%',
            content: '""',
            display: 'block',
          },
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <Flex
          hAlign="center"
          vAlign="center"
          styles={{
            position: 'absolute',
            top: '1rem',
            bottom: 0,
            left: 0,
            right: 0,
          }}
        >
          {loading ? (
            <Text content="Loading..." />
          ) : error ? (
            <Text error content={`Error: ${error.message}`} />
          ) : (
            <PerfChart perfData={filteredData} withExtremes={withExtremes} />
          )}
        </Flex>
      </Box>
    </div>
  )
}
