import * as React from 'react'

import { storiesOf } from '@storybook/react'

import '../global.scss'

import { OptionsHeader } from '../../src/libs/options/Header'

storiesOf('Options - OptionsHeader', module).add('Default', () => (
    <div style={{ maxWidth: 400 }}>
        <OptionsHeader version={'0.0.0'} />
    </div>
))