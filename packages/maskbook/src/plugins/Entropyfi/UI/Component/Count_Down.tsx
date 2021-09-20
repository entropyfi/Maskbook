import { Grid } from '@material-ui/core'
import { makeStyles } from '@masknet/theme'
import React, { useState, useEffect } from 'react'
// import { getSlicePoolId } from '../../utils'
import { initialState } from '../../hooks/slice'
import { useChainId } from '@masknet/web3-shared'

import { useLastUpdateTimestamp } from '../../hooks/usePoolData'
const useStyles = makeStyles()((theme) => ({
    countDownValue: {
        justifyContent: 'space-evenly',
        marginTop: theme.spacing(1),
        '& div': {
            backgroundColor: 'hsla(0, 0%, 100%, 0.2)',
            width: '40px',
            height: '38px',
            borderRadius: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            userSelect: 'none',
            '& span': {
                fontFamily: '-apple-system,system-ui,sans-serif',
                fontStyle: 'normal',
                fontSize: '20px',
                fontWeight: 600,
                textAlign: 'center',
                color: '#fff',
            },
        },
    },
    countDownTitle: {
        justifyContent: 'space-evenly',
        '& p': {
            width: '40px',
            fontFamily: '-apple-system,system-ui,sans-serif',
            textAlign: 'center',
            color: '#fff',
            fontWeight: 400,
            fontSize: '12px',
            lineHeight: '5px',
            userSelect: 'none',
            marginTop: '6px',
        },
    },
}))

export function CountDown(props: any) {
    const { classes } = useStyles()
    // const [coinId, coinName] = getSlicePoolId(props.poolId)
    const chainId = useChainId()
    const bidDuration = initialState[chainId][props.poolId].bidDuration // 2days
    const gameDuration = initialState[chainId][props.poolId].gameDuration // 5 days
    const lastUpdateTimestamp = useLastUpdateTimestamp(chainId, props.poolId) ?? 1

    const [CountDown, setCountDown] = useState<any>({
        day: 0,
        hr: 0,
        min: 0,
        sec: 0,
    })
    //#region
    useEffect(() => {
        const timer = setInterval(() => {
            const newCount = changeCountDown(props.locked, gameDuration, bidDuration, lastUpdateTimestamp)
            if (newCount === false) {
                setCountDown({
                    day: 0,
                    hr: 0,
                    min: 0,
                    sec: 0,
                })
                clearInterval(timer)
                return () => {}
            }
            setCountDown(newCount)
            return () => {}
        }, 1000)
        return () => clearInterval(timer)
    }, [CountDown])
    //#endregion

    return (
        <Grid item container>
            <Grid
                item
                container
                direction="row"
                className={classes.countDownValue}
                style={{ opacity: props.show ? 0 : 1 }}>
                <div>
                    <span>{CountDown.day || '-'}</span>
                </div>
                <div>
                    <span>{CountDown.hr || '-'}</span>
                </div>
                <div>
                    <span>{CountDown.min || '-'}</span>
                </div>
                <div>
                    <span>{CountDown.sec || '-'}</span>
                </div>
            </Grid>
            <Grid
                item
                container
                direction="row"
                className={classes.countDownTitle}
                style={{ opacity: props.show ? 0 : 1 }}>
                <p>Day</p>
                <p>Hr</p>
                <p>Min</p>
                <p>Sec</p>
            </Grid>
        </Grid>
    )
}

//=> Functions
const changeCountDown = (locked: boolean, gameDuration: number, bidDuration: number, startTimestamp: number) => {
    let sec: number = 0
    let min: number = 0
    let hr: number = 0
    let day: number = 0

    //---------
    const countdownDuration: number = locked ? gameDuration : bidDuration
    const nowTimetamp = Math.floor(Date.now() / 1000)
    const left = +startTimestamp + +countdownDuration - nowTimetamp

    // console.log('time left', left)

    if (left >= 0 && left <= countdownDuration) {
        const { days, hours, minutes, seconds } = secToDaysHoursMinutes(left)
        day = days
        hr = hours
        min = minutes
        sec = seconds
    }
    //---------

    if (sec === 0 && min === 0 && hr === 0 && day === 0) return false

    if (sec > 0) sec = sec - 1
    else {
        sec = 59
        if (min > 0) min = min - 1
        else {
            min = 59
            if (hr > 0) hr = hr - 1
            else {
                hr = 23
                if (day > 0) day = day - 1
            }
        }
    }

    return {
        day: day < 10 ? `0${day}` : day,
        hr: hr < 10 ? `0${hr}` : hr,
        min: min < 10 ? `0${min}` : min,
        sec: sec < 10 ? `0${sec}` : sec,
    }
}

const secToDaysHoursMinutes = (totalseconds: number) => {
    const day = 86400
    const hour = 3600
    const minute = 60

    const days = Math.floor(totalseconds / day)
    const hours = Math.floor((totalseconds - days * day) / hour)
    const minutes = Math.floor((totalseconds - days * day - hours * hour) / minute)
    const seconds = totalseconds - days * day - hours * hour - minutes * minute

    return { days, hours, minutes, seconds }
}
