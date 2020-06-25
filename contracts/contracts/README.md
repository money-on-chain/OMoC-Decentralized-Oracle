# Smart-Contract Code structure

All the contracts are upgradeables so when they are deployed there are two instances
one has the implementation code and one the storage. We must have 
the storage well organized so different upgrades can reuse the same storage without
clashes. 
During upgrade the implementation code can be changed, but the storage
doesn't change (the variables keep the same slots). So it is 
better to have the storage separated from the implementation even in the source code.

To do that we have all the storage in one base contract that is inherited by the
implementation. All the reusable code is in libraries and doesn't use any
storage (libraries are stateless).   



