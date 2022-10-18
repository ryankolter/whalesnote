import { useCallback, useContext, useEffect, useState } from 'react';
import { GlobalContext } from '../../GlobalProvider';
import styled from '@emotion/styled';

import WaitingMask from '../../components/WaitingMask';

const InitingDataMask: React.FC<{}> = ({}) => {
    const { initingData } = useContext(GlobalContext);

    return (
        <InitingDataMaskContainer>
            <WaitingMask in={initingData} timeout={300}></WaitingMask>
        </InitingDataMaskContainer>
    );
};

const InitingDataMaskContainer = styled.div({});

export default InitingDataMask;
