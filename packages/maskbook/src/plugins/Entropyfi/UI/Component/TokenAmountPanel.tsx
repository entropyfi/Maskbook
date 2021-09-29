import { ChangeEvent, useCallback, useMemo } from 'react'
import { Box, Chip, ChipProps, InputProps, TextField, TextFieldProps, Typography } from '@material-ui/core'
import { makeStyles } from '@masknet/theme'
import type { FungibleTokenDetailed } from '@masknet/web3-shared'
import { useI18N } from '../../../../utils'
import { formatBalance } from '@masknet/web3-shared'
import { FormattedBalance, useStylesExtends } from '@masknet/shared'
import BigNumber from 'bignumber.js'
import classNames from 'classnames'

import { BtcIcon } from '../../constants/assets/global_btcCoin'
import { GasIcon } from '../../constants/assets/global_gasCoin'
import { UsdcIcon } from '../../constants/assets/global_usdc'
import { UsdtIcon } from '../../constants/assets/global_usdt'
import { DaiIcon } from '../../constants/assets/global_DaiCoin'

const MIN_AMOUNT_LENGTH = 1
const MAX_AMOUNT_LENGTH = 79

const useStyles = makeStyles()((theme) => {
    return {
        root: {},
        input: {
            '&::-webkit-outer-spin-button, &::-webkit-inner-spin-button': {
                '-webkit-appearance': 'none',
                margin: 0,
            },
            '-moz-appearance': 'textfield',
        },
        max: {
            marginRight: theme.spacing(0.5),
            borderRadius: 8,
        },
        token: {
            whiteSpace: 'pre',
            maxWidth: 300,
            paddingLeft: theme.spacing(1),
        },
        balance: {
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            overflow: 'hidden',
            maxWidth: '80%',
            fontSize: 12,
            top: theme.spacing(0.5),
            position: 'absolute',
        },
        inputShrinkLabel: {
            transform: 'translate(17px, -3px) scale(0.75) !important',
        },
        chip: {
            border: 'none',
            borderRadius: 8,
            paddingLeft: theme.spacing(0.5),
        },
        loadingChip: {
            marginRight: theme.spacing(-0.5),
        },
    }
})

export interface TokenAmountPanelProps extends withClasses<'root'> {
    amount: string
    maxAmount?: string
    balance: string
    disableToken?: boolean
    disableBalance?: boolean
    label: string
    token?: FungibleTokenDetailed | null
    onAmountChange: (amount: string) => void
    InputProps?: Partial<InputProps>
    MaxChipProps?: Partial<ChipProps>
    MaxChipStyle?: ChipProps['classes']
    TextFieldProps?: Partial<TextFieldProps>
    // E.g. red packet shares
    maxAmountShares?: number
    decimals: number
    coinName: string
}

export function TokenAmountPanel(props: TokenAmountPanelProps) {
    const {
        amount,
        maxAmount,
        balance,
        token,
        onAmountChange,
        maxAmountShares = 1,
        label,
        disableToken = false,
        disableBalance = false,
        MaxChipProps,
        decimals,
        coinName,
    } = props
    const { t } = useI18N()
    const classes = useStylesExtends(useStyles(), props)

    const iconArr: any = {
        BTC: <BtcIcon />,
        'ETH-GAS': <GasIcon />,

        USDT: <UsdtIcon />,
        USDC: <UsdcIcon />,
        DAI: <DaiIcon />,
    }
    //#region update amount by self
    const { RE_MATCH_WHOLE_AMOUNT, RE_MATCH_FRACTION_AMOUNT } = useMemo(
        () => ({
            RE_MATCH_FRACTION_AMOUNT: new RegExp(`^\\.\\d{0,${decimals}}$`), // .ddd...d
            RE_MATCH_WHOLE_AMOUNT: new RegExp(`^\\d*\\.?\\d{0,${decimals}}$`), // d.ddd...d
        }),
        [decimals],
    )
    const onChange = useCallback(
        (ev: ChangeEvent<HTMLInputElement>) => {
            const amount_ = ev.currentTarget.value.replace(/,/g, '.')
            if (RE_MATCH_FRACTION_AMOUNT.test(amount_)) onAmountChange(`0${amount_}`)
            else if (amount_ === '' || RE_MATCH_WHOLE_AMOUNT.test(amount_)) onAmountChange(amount_)
        },
        [onAmountChange, RE_MATCH_WHOLE_AMOUNT, RE_MATCH_FRACTION_AMOUNT],
    )
    //#endregion

    return (
        <TextField
            className={classes.root}
            label={label}
            fullWidth
            required
            type="text"
            value={amount}
            variant="outlined"
            onChange={onChange}
            placeholder="0.0"
            InputProps={{
                inputProps: {
                    autoComplete: 'off',
                    autoCorrect: 'off',
                    title: 'Token Amount',
                    inputMode: 'decimal',
                    min: 0,
                    minLength: MIN_AMOUNT_LENGTH,
                    maxLength: MAX_AMOUNT_LENGTH,
                    pattern: '^[0-9]*[.,]?[0-9]*$',
                    spellCheck: false,
                    className: classes.input,
                },
                endAdornment: disableToken ? null : coinName ? (
                    <Box
                        className={classes.token}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                        }}>
                        {!disableBalance ? (
                            <Typography
                                className={classes.balance}
                                color="textSecondary"
                                variant="body2"
                                component="span">
                                Balance:
                                <FormattedBalance value={balance} decimals={decimals} significant={6} />
                            </Typography>
                        ) : null}
                        <Box
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: 2,
                            }}>
                            <Chip
                                className={classNames(classes.chip, classes.loadingChip)}
                                icon={iconArr[coinName]}
                                size="small"
                                clickable={false}
                                variant="outlined"
                            />
                            {balance !== '0' && !disableBalance ? (
                                <Chip
                                    classes={{
                                        root: classNames(classes.max, MaxChipProps?.classes?.root),
                                        ...MaxChipProps?.classes,
                                    }}
                                    size="small"
                                    label="MAX"
                                    clickable
                                    color="primary"
                                    variant="outlined"
                                    onClick={() => {
                                        onAmountChange(
                                            formatBalance(
                                                new BigNumber(maxAmount ?? balance)
                                                    .dividedBy(maxAmountShares)
                                                    .decimalPlaces(0, 1),
                                                decimals,
                                            ),
                                        )
                                    }}
                                    {...MaxChipProps}
                                />
                            ) : null}
                        </Box>
                    </Box>
                ) : (
                    <Box
                        className={classes.token}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            justifyContent: 'center',
                            alignItems: 'flex-end',
                            marginTop: 2,
                        }}>
                        {!disableBalance ? (
                            <Typography
                                className={classes.balance}
                                color="textSecondary"
                                variant="body2"
                                component="span">
                                -
                            </Typography>
                        ) : null}
                        {/* <SelectTokenChip token={token} {...props.SelectTokenChip} /> */}
                    </Box>
                ),
                ...props.InputProps,
            }}
            InputLabelProps={{
                shrink: true,
                classes: {
                    shrink: classes.inputShrinkLabel,
                },
            }}
            {...props.TextFieldProps}
        />
    )
}