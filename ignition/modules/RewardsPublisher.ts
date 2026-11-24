import { buildModule } from '@nomicfoundation/ignition-core';

export default buildModule('RewardsPublisherModule', (m) => {
    const governor = m.getParameter('governor');
    const name = m.getParameter('name');
    const distributor = m.getParameter('distributor');
    const token = m.getParameter('token');
    const oracleManager = m.getParameter('oracleManager');
    const registry = m.getParameter('registry');
    // Existing ProxyAdmin controlled by the deployment's upgrade governance.
    const proxyAdmin = m.getParameter('proxyAdmin');

    const implementation = m.contract('RewardsPublisher');
    const initialize = m.encodeFunctionCall(implementation, 'initialize', [
        governor,
        name,
        distributor,
        token,
        {
            maxOraclesPerRound: m.getParameter('maxOraclesPerRound'),
            maxSubscribedOraclesPerRound: m.getParameter('maxSubscribedOraclesPerRound'),
            roundLockPeriod: m.getParameter('roundLockPeriod'),
            maxMissedSigRounds: m.getParameter('maxMissedSigRounds', 0n),
        },
        oracleManager,
        registry,
        m.getParameter('minOraclesPerRound', 0n),
    ]);
    const proxy = m.contract('TransparentUpgradeableProxy', [
        implementation,
        proxyAdmin,
        initialize,
    ]);
    const publisher = m.contractAt('RewardsPublisher', proxy, { id: 'Publisher' });
    // Prepare the governance action; deployment does not execute governance or
    // transfer the Distributor operator role away from the centralized operator.
    const registrationChange = m.contract('OracleManagerPairChange', [
        oracleManager,
        name,
        publisher,
    ]);

    return { implementation, proxy, publisher, registrationChange };
});
