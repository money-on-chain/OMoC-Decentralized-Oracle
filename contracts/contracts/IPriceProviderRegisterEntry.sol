pragma solidity 0.6.0;

/// @title PPrice
interface IPriceProviderRegisterEntry  {
    enum IPriceProviderType {None, Published, Calculated}

    /// @notice return the type of provider
    function getPriceProviderType() external pure returns (IPriceProviderType);

}
