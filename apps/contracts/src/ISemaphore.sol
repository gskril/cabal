// SPDX-License-Identifier: MIT
pragma solidity 0.8.23;

import {ISemaphore as ISemaphoreBase} from "@semaphore-protocol/contracts/interfaces/ISemaphore.sol";
import {ISemaphoreGroups} from "@semaphore-protocol/contracts/interfaces/ISemaphoreGroups.sol";

interface ISemaphore is ISemaphoreGroups, ISemaphoreBase {}
